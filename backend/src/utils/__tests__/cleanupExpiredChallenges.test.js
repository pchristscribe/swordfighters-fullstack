import { describe, it, expect, vi } from 'vitest';
import { cleanupExpiredChallenges, isValidChallenge } from '../cleanupExpiredChallenges.js';

describe('cleanupExpiredChallenges', () => {
  it('returns the count from a successful update', async () => {
    // postgres-js update returns an array-like result with .count
    const result = Object.assign([], { count: 3 });
    const sql = vi.fn().mockResolvedValue(result);
    const logger = { info: vi.fn(), error: vi.fn() };

    const count = await cleanupExpiredChallenges(sql, logger);

    expect(count).toBe(3);
    expect(sql).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith({ count: 3 }, expect.stringContaining('Cleaned up'));
  });

  it('returns 0 and skips logging when nothing was cleaned up', async () => {
    const result = Object.assign([], { count: 0 });
    const sql = vi.fn().mockResolvedValue(result);
    const logger = { info: vi.fn(), error: vi.fn() };

    const count = await cleanupExpiredChallenges(sql, logger);

    expect(count).toBe(0);
    expect(logger.info).not.toHaveBeenCalled();
  });

  it('rethrows errors after logging them', async () => {
    const sql = vi.fn().mockRejectedValue(new Error('connection refused'));
    const logger = { info: vi.fn(), error: vi.fn() };

    await expect(cleanupExpiredChallenges(sql, logger)).rejects.toThrow('connection refused');
    expect(logger.error).toHaveBeenCalledWith(
      { error: 'connection refused' },
      expect.stringContaining('Error cleaning up')
    );
  });
});

describe('isValidChallenge', () => {
  it('should return false when challenge is missing', () => {
    const admin = {
      currentChallenge: null,
      challengeExpiresAt: new Date(Date.now() + 5 * 60 * 1000)
    };

    expect(isValidChallenge(admin)).toBe(false);
  });

  it('should return false when expiration is missing', () => {
    const admin = {
      currentChallenge: 'test-challenge',
      challengeExpiresAt: null
    };

    expect(isValidChallenge(admin)).toBe(false);
  });

  it('should return false when challenge is expired', () => {
    const admin = {
      currentChallenge: 'test-challenge',
      challengeExpiresAt: new Date(Date.now() - 1000)
    };

    expect(isValidChallenge(admin)).toBe(false);
  });

  it('should return true when challenge is valid', () => {
    const admin = {
      currentChallenge: 'test-challenge',
      challengeExpiresAt: new Date(Date.now() + 5 * 60 * 1000)
    };

    expect(isValidChallenge(admin)).toBe(true);
  });
});
