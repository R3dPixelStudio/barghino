import type {
  AssistantSettings,
  ContentStore,
  GalleryItem,
  Inquiry,
  Media,
  Post,
} from './types.ts';
import { mediaLimits } from '../src/shared/config/media.ts';
import { HttpError, detectMedia } from './validation.ts';

export type DatabaseValue = string | number | ArrayBuffer;
export type Statement = { sql: string; args: DatabaseValue[] };
export interface DatabaseDriver {
  all<T>(sql: string, args?: DatabaseValue[]): Promise<T[]>;
  run(sql: string, args: DatabaseValue[]): Promise<number>;
  batch(statements: Statement[]): Promise<number[]>;
}

export class Repository implements ContentStore {
  db: DatabaseDriver;
  constructor(db: DatabaseDriver) {
    this.db = db;
  }
  private async saveReferenced(
    write: Statement,
    table: 'posts' | 'portfolio',
    id: string,
    revision: string,
    content: string,
  ) {
    const keys = [
      ...new Set(
        Array.from(
          content.matchAll(/\/media\/([a-f0-9-]{36}\.(?:png|jpg|webp|mp4|webm|vtt))/g),
          (match) => match[1],
        ),
      ),
    ];
    try {
      const changes = await this.db.batch([
        write,
        {
          sql: `DELETE FROM media_refs WHERE owner_type=? AND owner_id=? AND EXISTS (SELECT 1 FROM ${table} WHERE id=? AND revision=?)`,
          args: [table, id, id, revision],
        },
        {
          sql: `INSERT INTO media_refs (owner_type,owner_id,key) SELECT ?,?,value FROM json_each(?) WHERE EXISTS (SELECT 1 FROM ${table} WHERE id=? AND revision=?)`,
          args: [table, id, JSON.stringify(keys), id, revision],
        },
      ]);
      return changes[0] === 1;
    } catch (error) {
      if (error instanceof Error && /foreign key constraint/i.test(error.message))
        throw new HttpError(
          400,
          'Referenced media was removed. Select an existing file before saving.',
        );
      throw error;
    }
  }
  async posts() {
    return (
      await this.db.all<{ data: string }>('SELECT data FROM posts ORDER BY updated_at DESC')
    ).map((row) => JSON.parse(row.data) as Post);
  }
  async savePost(post: Post, expectedRevision: string | null) {
    const write: Statement = expectedRevision
      ? {
          sql: 'UPDATE posts SET locale=?, slug=?, status=?, revision=?, updated_at=?, data=? WHERE id=? AND revision=?',
          args: [
            post.locale,
            post.slug,
            post.status,
            post.revision,
            post.updatedAt,
            JSON.stringify(post),
            post.id,
            expectedRevision,
          ],
        }
      : {
          sql: 'INSERT INTO posts (id,locale,slug,status,revision,updated_at,data) VALUES (?,?,?,?,?,?,?)',
          args: [
            post.id,
            post.locale,
            post.slug,
            post.status,
            post.revision,
            post.updatedAt,
            JSON.stringify(post),
          ],
        };
    try {
      return await this.saveReferenced(
        write,
        'posts',
        post.id,
        post.revision,
        JSON.stringify(post),
      );
    } catch (error) {
      if (error instanceof Error && /unique constraint/i.test(error.message)) return false;
      throw error;
    }
  }
  async deletePost(id: string, revision: string) {
    return (await this.db.run('DELETE FROM posts WHERE id=? AND revision=?', [id, revision])) === 1;
  }
  async portfolio() {
    return (
      await this.db.all<{ data: string }>('SELECT data FROM portfolio ORDER BY sort_order, id')
    ).map((row) => JSON.parse(row.data) as GalleryItem);
  }
  async saveWork(item: GalleryItem, revision: string | null) {
    const write: Statement = revision
      ? {
          sql: 'UPDATE portfolio SET sort_order=?, revision=?, data=? WHERE id=? AND revision=?',
          args: [item.order, item.revision, JSON.stringify(item), item.id, revision],
        }
      : {
          sql: 'INSERT OR IGNORE INTO portfolio (id,sort_order,revision,data) VALUES (?,?,?,?)',
          args: [item.id, item.order, item.revision, JSON.stringify(item)],
        };
    return this.saveReferenced(write, 'portfolio', item.id, item.revision, JSON.stringify(item));
  }
  async deleteWork(id: string, revision: string) {
    return (
      (await this.db.run('DELETE FROM portfolio WHERE id=? AND revision=?', [id, revision])) === 1
    );
  }
  async assistantSettings() {
    const rows = await this.db.all<{ data: string }>(
      "SELECT data FROM settings WHERE key='assistant'",
    );
    return rows[0] ? (JSON.parse(rows[0].data) as AssistantSettings) : null;
  }
  async saveAssistantSettings(settings: AssistantSettings, revision: string | null) {
    if (revision)
      return (
        (await this.db.run(
          "UPDATE settings SET revision=?,data=? WHERE key='assistant' AND revision=?",
          [settings.revision, JSON.stringify(settings), revision],
        )) === 1
      );
    return (
      (await this.db.run(
        "INSERT OR IGNORE INTO settings (key,revision,data) VALUES ('assistant',?,?)",
        [settings.revision, JSON.stringify(settings)],
      )) === 1
    );
  }
  async reserveChat(fingerprint: string) {
    const window = Math.floor(Date.now() / 3600000);
    await this.db.run('DELETE FROM chat_limits WHERE window<?', [window - 24]);
    return (
      (await this.db.run(
        'INSERT INTO chat_limits (fingerprint,window,count) VALUES (?,?,1) ON CONFLICT(fingerprint,window) DO UPDATE SET count=count+1 WHERE count<20',
        [fingerprint, window],
      )) === 1
    );
  }
  async media() {
    return (
      await this.db.all<{ data: string }>('SELECT data FROM media ORDER BY created_at DESC')
    ).map((row) => JSON.parse(row.data) as Media);
  }
  async putMedia(meta: Media, bytes: ArrayBuffer) {
    if (bytes.byteLength !== meta.size || !meta.size || meta.size > mediaLimits.upload)
      throw new HttpError(413, 'Media exceeds the upload limit');
    const statements: Statement[] = [
      {
        sql: 'INSERT OR IGNORE INTO media (key,created_at,data) VALUES (?,?,?)',
        args: [meta.key, meta.createdAt, JSON.stringify(meta)],
      },
      { sql: 'INSERT INTO media_payloads (key,size) VALUES (?,?)', args: [meta.key, meta.size] },
    ];
    for (let offset = 0, part = 0; offset < bytes.byteLength; offset += mediaLimits.chunk, part++)
      statements.push({
        sql: 'INSERT INTO media_chunks (key,part,bytes) VALUES (?,?,?)',
        args: [meta.key, part, bytes.slice(offset, offset + mediaLimits.chunk)],
      });
    try {
      await this.db.batch(statements);
    } catch (error) {
      if (error instanceof Error && /media capacity exceeded/.test(error.message))
        throw new HttpError(413, 'The 400 MB media library is full. Remove unused files first.');
      throw error;
    }
  }
  async mediaInfo(key: string) {
    const rows = await this.db.all<{ data: string }>(
      'SELECT media.data FROM media JOIN media_payloads USING (key) WHERE key=?',
      [key],
    );
    return rows[0] ? (JSON.parse(rows[0].data) as Media) : null;
  }
  async mediaUsage() {
    const rows = await this.db.all<{ used: number }>(
      'SELECT (SELECT COALESCE(SUM(size),0) FROM media_payloads)+(SELECT COALESCE(SUM(size),0) FROM media_uploads) AS used',
    );
    return { used: rows[0].used, limit: mediaLimits.library };
  }
  async beginMedia(meta: Media) {
    await this.db.run('DELETE FROM media_uploads WHERE created_at<?', [
      new Date(Date.now() - 3600_000).toISOString(),
    ]);
    try {
      await this.db.run('INSERT INTO media_uploads (key,created_at,size,data) VALUES (?,?,?,?)', [
        meta.key,
        meta.createdAt,
        meta.size,
        JSON.stringify(meta),
      ]);
    } catch (error) {
      if (error instanceof Error && /media capacity exceeded/.test(error.message))
        throw new HttpError(413, 'The 400 MB media library is full. Remove unused files first.');
      throw error;
    }
  }
  async appendMedia(key: string, part: number, bytes: ArrayBuffer) {
    if (part === 0) {
      const rows = await this.db.all<{ data: string }>(
        'SELECT data FROM media_uploads WHERE key=?',
        [key],
      );
      if (!rows[0]) return false;
      const meta = JSON.parse(rows[0].data) as Media;
      if (detectMedia(new Uint8Array(bytes))?.type !== meta.type)
        throw new HttpError(415, 'The file contents do not match its format');
    }
    return (
      (await this.db.run(
        'INSERT OR IGNORE INTO media_upload_chunks (key,part,bytes) SELECT key,?,? FROM media_uploads WHERE key=? AND next_part=? AND ?=MIN(262144,size-received)',
        [part, bytes, key, part, bytes.byteLength],
      )) === 1
    );
  }
  async finishMedia(key: string) {
    const changes = await this.db.batch([
      {
        sql: 'INSERT INTO media (key,created_at,data) SELECT key,created_at,data FROM media_uploads WHERE key=? AND received=size',
        args: [key],
      },
      {
        sql: 'INSERT INTO media_payloads (key,size) SELECT key,size FROM media_uploads WHERE key=? AND received=size',
        args: [key],
      },
      {
        sql: 'INSERT INTO media_chunks (key,part,bytes) SELECT key,part,bytes FROM media_upload_chunks WHERE key=? AND EXISTS (SELECT 1 FROM media_payloads WHERE key=?)',
        args: [key, key],
      },
      {
        sql: 'DELETE FROM media_uploads WHERE key=? AND EXISTS (SELECT 1 FROM media_payloads WHERE key=?)',
        args: [key, key],
      },
    ]);
    return changes[0] === 1 ? this.mediaInfo(key) : null;
  }
  async cancelMedia(key: string) {
    await this.db.run('DELETE FROM media_uploads WHERE key=?', [key]);
  }
  async deleteMedia(key: string) {
    // Foreign-key references are saved in the same transaction as each article/gallery revision.
    return (
      (await this.db.run(
        'DELETE FROM media WHERE key=? AND NOT EXISTS (SELECT 1 FROM media_refs WHERE media_refs.key=media.key)',
        [key],
      )) === 1
    );
  }
  async getMedia(key: string, range?: { start: number; end: number }) {
    const meta = await this.mediaInfo(key);
    if (!meta) return null;
    const start = range?.start ?? 0;
    const end = range?.end ?? meta.size - 1;
    if (
      !Number.isInteger(start) ||
      !Number.isInteger(end) ||
      start < 0 ||
      end < start ||
      end >= meta.size
    )
      throw new HttpError(416, 'Invalid media range');
    let part = Math.floor(start / mediaLimits.chunk);
    const last = Math.floor(end / mediaLimits.chunk);
    const db = this.db;
    // Four small rows per pull bound memory and keep a 20 MiB read below 50 D1 queries.
    const body = new ReadableStream<Uint8Array>({
      async pull(controller) {
        try {
          const highPart = Math.min(last, part + 3);
          const rows = await db.all<{ part: number; bytes: number[] | Uint8Array }>(
            'SELECT part,bytes FROM media_chunks WHERE key=? AND part BETWEEN ? AND ? ORDER BY part',
            [key, part, highPart],
          );
          if (rows.length !== highPart - part + 1) throw new Error('Incomplete media payload');
          for (const row of rows) {
            if (row.part !== part) throw new Error('Unordered media payload');
            const chunk = Uint8Array.from(row.bytes);
            const low = Math.max(0, start - part * mediaLimits.chunk);
            const high = Math.min(chunk.length, end - part * mediaLimits.chunk + 1);
            controller.enqueue(chunk.subarray(low, high));
            part++;
          }
          if (part > last) controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });
    return { body, type: meta.type, size: end - start + 1 };
  }
  async inquiries() {
    return (
      await this.db.all<{ data: string }>(
        'SELECT data FROM inquiries ORDER BY created_at DESC LIMIT 250',
      )
    ).map((row) => JSON.parse(row.data) as Inquiry);
  }
  async addInquiry(inquiry: Inquiry, fingerprint: string) {
    const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    return (
      (await this.db.run(
        'INSERT INTO inquiries (id,created_at,fingerprint,data) SELECT ?,?,?,? WHERE (SELECT count(*) FROM inquiries WHERE fingerprint=? AND created_at>?)<5',
        [inquiry.id, inquiry.createdAt, fingerprint, JSON.stringify(inquiry), fingerprint, cutoff],
      )) === 1
    );
  }
}
