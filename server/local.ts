import { DatabaseSync } from 'node:sqlite';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Repository, type DatabaseDriver } from './repository.ts';

export async function localRepository(directory: string) {
  const mediaRoot = resolve(directory, 'media');
  await mkdir(mediaRoot, { recursive: true });
  const db = new DatabaseSync(resolve(directory, 'content.sqlite'));
  db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
  db.exec(await readFile(new URL('../migrations/0001_content.sql', import.meta.url), 'utf8'));
  db.exec(await readFile(new URL('../migrations/0002_experience.sql', import.meta.url), 'utf8'));
  const driver: DatabaseDriver = {
    all: async <T>(sql: string, args: (string | number)[] = []) =>
      db.prepare(sql).all(...args) as T[],
    run: async (sql, args) => Number(db.prepare(sql).run(...args).changes),
  };
  const types: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    webp: 'image/webp',
    mp4: 'video/mp4',
    webm: 'video/webm',
    vtt: 'text/vtt; charset=utf-8',
  };
  const repository = new Repository(driver, {
    put: async (key, bytes) => {
      await writeFile(resolve(mediaRoot, key), new Uint8Array(bytes), {
        flag: 'wx',
      });
    },
    remove: async (key) => {
      await unlink(resolve(mediaRoot, key));
    },
    get: async (key) => {
      if (!/^[a-f0-9-]{36}\.(png|jpg|webp|mp4|webm|vtt)$/.test(key)) return null;
      try {
        const bytes = await readFile(resolve(mediaRoot, key));
        return {
          body: bytes.buffer.slice(
            bytes.byteOffset,
            bytes.byteOffset + bytes.byteLength,
          ) as ArrayBuffer,
          size: bytes.length,
          type: types[key.split('.').at(-1) ?? ''] ?? 'application/octet-stream',
        };
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
        throw error;
      }
    },
  });
  return { repository, close: () => db.close() };
}
