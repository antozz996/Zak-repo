import type { Request, Response, NextFunction } from "express";

type RateLimitOptions = {
  limit: number;
  windowMs: number;
  keyPrefix: string;
  skip?: (req: Request) => boolean;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

function getClientKey(req: Request, keyPrefix: string) {
  const forwardedFor = req.headers["x-forwarded-for"];
  const forwardedIp = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor?.split(",")[0]?.trim();
  const ip = forwardedIp || req.ip || "unknown";
  return `${keyPrefix}:${ip}`;
}

export function createRateLimiter(options: RateLimitOptions) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (options.skip?.(req)) {
      next();
      return;
    }

    const now = Date.now();
    const key = getClientKey(req, options.keyPrefix);
    const existing = buckets.get(key);

    if (!existing || existing.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      next();
      return;
    }

    if (existing.count >= options.limit) {
      res.status(429).json({
        success: false,
        message: "Rate limit exceeded",
      });
      return;
    }

    existing.count += 1;
    next();
  };
}
