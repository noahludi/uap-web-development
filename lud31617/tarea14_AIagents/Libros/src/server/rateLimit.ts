const windows: Record<string, { count: number; expiresAt: number }> = {};

const now = () => Date.now();

export const rateLimit = (identifier: string) => {
  const limit = Number(process.env.RATE_LIMIT_MAX_REQUESTS ?? 100);
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS ?? 15 * 60 * 1000);
  const key = identifier || 'anonymous';
  const current = windows[key];
  const nowTs = now();

  if (!current || current.expiresAt < nowTs) {
    windows[key] = { count: 1, expiresAt: nowTs + windowMs };
    return { success: true, remaining: limit - 1, resetIn: windowMs } as const;
  }

  if (current.count >= limit) {
    return { success: false, remaining: 0, resetIn: current.expiresAt - nowTs } as const;
  }

  current.count += 1;
  return { success: true, remaining: limit - current.count, resetIn: current.expiresAt - nowTs } as const;
};
