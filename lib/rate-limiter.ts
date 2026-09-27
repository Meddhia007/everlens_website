import { connectToDatabase } from '@/lib/mongodb';
import { AuthRateLimit } from '@/models/AuthRateLimit';

export interface RateLimitCheckResult {
  allowed: boolean;
  lockedOut: boolean;
  remainingMinutes: number;
  attemptsRemaining: number;
}

/**
 * Checks if a specific action key is currently locked out due to excessive failed attempts.
 */
export async function checkRateLimit(key: string, maxAttempts = 5): Promise<RateLimitCheckResult> {
  await connectToDatabase();

  const record = await AuthRateLimit.findOne({ key }).lean();
  if (!record) {
    return {
      allowed: true,
      lockedOut: false,
      remainingMinutes: 0,
      attemptsRemaining: maxAttempts,
    };
  }

  const isLockedOut = Boolean(record.lockedUntil && new Date(record.lockedUntil) > new Date());
  let remainingMinutes = 0;

  if (isLockedOut && record.lockedUntil) {
    const remainingMs = new Date(record.lockedUntil).getTime() - Date.now();
    remainingMinutes = Math.max(1, Math.ceil(remainingMs / 60000));
  }

  return {
    allowed: !isLockedOut,
    lockedOut: isLockedOut,
    remainingMinutes,
    attemptsRemaining: Math.max(0, maxAttempts - (record.attempts || 0)),
  };
}

/**
 * Records a failed attempt for a specific key.
 * If attempts reach maxAttempts (default 5), activates a 15-minute lockout cooldown.
 */
export async function recordFailedAttempt(
  key: string,
  maxAttempts = 5,
  lockoutMinutes = 15
): Promise<RateLimitCheckResult> {
  await connectToDatabase();

  const now = new Date();
  let record = await AuthRateLimit.findOne({ key });
  const newAttempts = (record?.attempts || 0) + 1;

  if (!record) {
    record = new AuthRateLimit({
      key,
      attempts: newAttempts,
      lockedUntil: null,
      expireAt: new Date(now.getTime() + lockoutMinutes * 60 * 1000),
    });
  } else {
    record.attempts = newAttempts;
    record.expireAt = new Date(now.getTime() + lockoutMinutes * 60 * 1000);
  }

  let isLockedOut = false;
  let remainingMinutes = 0;

  if (newAttempts >= maxAttempts) {
    isLockedOut = true;
    const lockedUntil = new Date(now.getTime() + lockoutMinutes * 60 * 1000);
    record.lockedUntil = lockedUntil;
    record.expireAt = new Date(now.getTime() + (lockoutMinutes + 1) * 60 * 1000);
    remainingMinutes = lockoutMinutes;
  }

  await record.save();

  return {
    allowed: !isLockedOut,
    lockedOut: isLockedOut,
    remainingMinutes,
    attemptsRemaining: Math.max(0, maxAttempts - newAttempts),
  };
}

/**
 * Clears rate limiting record upon successful authentication.
 */
export async function clearRateLimit(key: string): Promise<void> {
  await connectToDatabase();
  await AuthRateLimit.deleteOne({ key });
}
