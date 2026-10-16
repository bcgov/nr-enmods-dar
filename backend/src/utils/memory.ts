const toMB = (bytes: number) => Math.round(bytes / 1024 / 1024);

/**
 * Returns a short summary of current process memory usage for logging,
 * e.g. "[heapUsed=120MB heapTotal=150MB rss=210MB]".
 */
export function heapUsage(): string {
  const { heapUsed, heapTotal, rss } = process.memoryUsage();
  return `[heapUsed=${toMB(heapUsed)}MB heapTotal=${toMB(heapTotal)}MB rss=${toMB(rss)}MB]`;
}
