import { DatabaseSync } from 'node:sqlite';
import { mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Repository, type DatabaseDriver, type DatabaseValue } from './repository.ts';

export async function localRepository(directory: string) {
  await mkdir(directory, { recursive: true });
  const db = new DatabaseSync(resolve(directory, 'content.sqlite'));
  db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;');
  for (const migration of ['0001_content', '0002_experience', '0003_d1_media'])
    db.exec(await readFile(new URL(`../migrations/${migration}.sql`, import.meta.url), 'utf8'));
  const bindings = (args: DatabaseValue[]) =>
    args.map((value) => (value instanceof ArrayBuffer ? new Uint8Array(value) : value));
  const driver: DatabaseDriver = {
    all: async <T>(sql: string, args: DatabaseValue[] = []) =>
      db.prepare(sql).all(...bindings(args)) as T[],
    run: async (sql, args) => Number(db.prepare(sql).run(...bindings(args)).changes),
    batch: async (statements) => {
      db.exec('BEGIN IMMEDIATE');
      try {
        const changes = statements.map(({ sql, args }) =>
          Number(db.prepare(sql).run(...bindings(args)).changes),
        );
        db.exec('COMMIT');
        return changes;
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    },
  };
  const repository = new Repository(driver);
  try {
    // Import legacy local files once, retaining the originals as a backup.
    const pending = await driver.all<{ key: string; data: string }>(
      'SELECT key,data FROM media WHERE NOT EXISTS (SELECT 1 FROM media_payloads WHERE media_payloads.key=media.key)',
    );
    for (const row of pending) {
      if (!/^[a-f0-9-]{36}\.(png|jpg|webp|mp4|webm|vtt)$/.test(row.key))
        throw new Error('Invalid legacy media key');
      const bytes = await readFile(resolve(directory, 'media', row.key));
      await repository.putMedia(
        JSON.parse(row.data),
        bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer,
      );
    }
  } catch (error) {
    db.close();
    throw error;
  }
  return { repository, close: () => db.close() };
}
