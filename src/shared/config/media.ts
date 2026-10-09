export const mediaLimits = {
  library: 400_000_000,
  upload: 20 * 1024 * 1024,
  image: 8 * 1024 * 1024,
  chunk: 256 * 1024,
} as const;
