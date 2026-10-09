import { expect, it } from 'vitest';
import { flatRscPath } from '../../scripts/finalize-export.mjs';

it('normalizes Windows and POSIX RSC segment paths without changing routes', () => {
  expect(flatRscPath('en\\__next.$oc$locale\\__PAGE__.txt')).toBe(
    'en/__next.$oc$locale.__PAGE__.txt',
  );
  expect(flatRscPath('fa/__next.$oc$locale/__PAGE__.txt')).toBe(
    'fa/__next.$oc$locale.__PAGE__.txt',
  );
  expect(flatRscPath('__next.$oc$locale/__PAGE__.txt')).toBe('__next.$oc$locale.__PAGE__.txt');
  expect(flatRscPath('fa/__next._tree.txt')).toBeNull();
  expect(flatRscPath('fa/index.txt')).toBeNull();
  expect(flatRscPath('fa/__next/asset.js')).toBeNull();
});
