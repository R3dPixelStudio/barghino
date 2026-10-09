import type { D1Database } from '@cloudflare/workers-types';
import type { DatabaseDriver, DatabaseValue } from './repository.ts';

export function d1Driver(database: D1Database): DatabaseDriver {
  return {
    all: async <T>(sql: string, args: DatabaseValue[] = []) =>
      (
        await database
          .prepare(sql)
          .bind(...args)
          .all<T>()
      ).results,
    run: async (sql, args) => {
      // D1 meta.changes includes trigger/cascade writes. SQLite changes() counts the primary statement.
      const result = await database.batch([
        database.prepare(sql).bind(...args),
        database.prepare('SELECT changes() AS changed'),
      ]);
      return Number((result[1].results[0] as { changed: number }).changed);
    },
    batch: async (statements) => {
      const result = await database.batch(
        statements.flatMap(({ sql, args }) => [
          database.prepare(sql).bind(...args),
          database.prepare('SELECT changes() AS changed'),
        ]),
      );
      return statements.map((_, index) =>
        Number((result[index * 2 + 1].results[0] as { changed: number }).changed),
      );
    },
  };
}
