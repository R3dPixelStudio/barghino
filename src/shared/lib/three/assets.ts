'use client';

import { useGLTF } from '@react-three/drei';
import type { Quality } from '@/entities/experience/model/store';

export type ElectricalAsset = {
  id: string;
  urls: Record<Quality, string>;
};

// Register only files committed to public/models. The procedural hero needs no downloads.
export const electricalAssets: readonly ElectricalAsset[] = [];

export function scheduleAssetPreload(quality: Quality, assets = electricalAssets) {
  if (!assets.length) return () => {};
  const connection = (
    navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }
  ).connection;
  if (connection?.saveData || connection?.effectiveType?.includes('2g')) return () => {};
  const preload = () => {
    // Meshopt is built into Drei's loader; supply Meshopt-compressed GLBs.
    for (const asset of assets) useGLTF.preload(asset.urls[quality], false, true);
  };
  if ('requestIdleCallback' in window) {
    const id = window.requestIdleCallback(preload, { timeout: 2500 });
    return () => window.cancelIdleCallback(id);
  }
  const id = globalThis.setTimeout(preload, 1500);
  return () => globalThis.clearTimeout(id);
}
