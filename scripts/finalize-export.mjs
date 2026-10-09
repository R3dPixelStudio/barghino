import { readdir, copyFile, readFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

// Next's static RSC client uses dots in segment filenames. Some Windows
// exports retain separators. Preserve the originals and publish matching aliases.
export function flatRscPath(path) {
  if (!path.endsWith('.txt')) return null;
  const parts = path.split(/[\\/]/);
  const index = parts.findIndex((part) => part.startsWith('__next'));
  if (index < 0 || index === parts.length - 1) return null;
  return [...parts.slice(0, index), parts.slice(index).join('.')].join('/');
}

export async function finalizeExport(root = resolve('out')) {
  async function walk(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
      if (entry.name === '_next') continue;
      const file = resolve(directory, entry.name);
      if (entry.isDirectory()) files.push(...(await walk(file)));
      else if (entry.isFile()) files.push(file);
    }
    return files;
  }
  let count = 0;
  for (const file of await walk(root)) {
    const alias = flatRscPath(relative(root, file));
    if (!alias) continue;
    const destination = resolve(root, alias);
    const existing = await readFile(destination).catch((error) => {
      if (error.code !== 'ENOENT') throw error;
      return null;
    });
    if (existing && !existing.equals(await readFile(file))) {
      throw new Error(`Conflicting RSC export alias: ${alias}`);
    }
    if (!existing) {
      await copyFile(file, destination);
      count++;
    }
  }
  process.stdout.write(`Static RSC export: ${count} segment aliases prepared.\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await finalizeExport();
}
