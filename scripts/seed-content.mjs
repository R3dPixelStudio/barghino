import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { localRepository } from '../server/local.ts';
import { validatePost } from '../server/validation.ts';

const { repository, close } = await localRepository(resolve(process.env.CONTENT_DIR ?? '.data'));
try {
  const starters = JSON.parse(
    await readFile(new URL('../content/starter-posts.json', import.meta.url), 'utf8'),
  );
  const existing = await repository.posts();
  let created = 0;
  for (const item of starters) {
    if (existing.some((post) => post.locale === item.locale && post.slug === item.slug)) continue;
    if (await repository.savePost(validatePost(item), null)) created++;
  }
  process.stdout.write(
    `Created ${created} starter articles locally. Existing articles were preserved.\n`,
  );
} finally {
  close();
}
