import type {
  AssistantSettings,
  ContentStore,
  GalleryItem,
  Inquiry,
  Media,
  Post,
  StoredFile,
} from './types.ts';

export interface DatabaseDriver {
  all<T>(sql: string, args?: (string | number)[]): Promise<T[]>;
  run(sql: string, args: (string | number)[]): Promise<number>;
}
export interface MediaDriver {
  put(key: string, bytes: ArrayBuffer, type: string): Promise<void>;
  get(key: string): Promise<StoredFile | null>;
  remove(key: string): Promise<void>;
}

export class Repository implements ContentStore {
  db: DatabaseDriver;
  files: MediaDriver;
  constructor(db: DatabaseDriver, files: MediaDriver) {
    this.db = db;
    this.files = files;
  }
  async posts() {
    return (
      await this.db.all<{ data: string }>('SELECT data FROM posts ORDER BY updated_at DESC')
    ).map((row) => JSON.parse(row.data) as Post);
  }
  async savePost(post: Post, expectedRevision: string | null) {
    try {
      if (expectedRevision)
        return (
          (await this.db.run(
            'UPDATE posts SET locale=?, slug=?, status=?, revision=?, updated_at=?, data=? WHERE id=? AND revision=?',
            [
              post.locale,
              post.slug,
              post.status,
              post.revision,
              post.updatedAt,
              JSON.stringify(post),
              post.id,
              expectedRevision,
            ],
          )) === 1
        );
      return (
        (await this.db.run(
          'INSERT INTO posts (id,locale,slug,status,revision,updated_at,data) VALUES (?,?,?,?,?,?,?)',
          [
            post.id,
            post.locale,
            post.slug,
            post.status,
            post.revision,
            post.updatedAt,
            JSON.stringify(post),
          ],
        )) === 1
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
    if (revision)
      return (
        (await this.db.run(
          'UPDATE portfolio SET sort_order=?, revision=?, data=? WHERE id=? AND revision=?',
          [item.order, item.revision, JSON.stringify(item), item.id, revision],
        )) === 1
      );
    return (
      (await this.db.run(
        'INSERT OR IGNORE INTO portfolio (id,sort_order,revision,data) VALUES (?,?,?,?)',
        [item.id, item.order, item.revision, JSON.stringify(item)],
      )) === 1
    );
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
    await this.files.put(meta.key, bytes, meta.type);
    try {
      await this.db.run('INSERT INTO media (key,created_at,data) VALUES (?,?,?)', [
        meta.key,
        meta.createdAt,
        JSON.stringify(meta),
      ]);
    } catch (error) {
      await this.files.remove(meta.key);
      throw error;
    }
  }
  async getMedia(key: string) {
    return this.files.get(key);
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
