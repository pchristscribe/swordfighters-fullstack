import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { cleanupExpiredChallenges, isValidChallenge } from '../cleanupExpiredChallenges.js';

const prisma = new PrismaClient();

describe('cleanupExpiredChallenges', () => {
  // Use a timestamp-based prefix to isolate this test's data
  // This ensures our test data won't be affected by other test cleanup hooks
  const testEmailPrefix = `cleanup-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  beforeEach(async () => {
    // Ensure admin doesn't exist before creating (in case of partial cleanup)
    await prisma.admin.deleteMany({
      where: {
        email: {
          startsWith: testEmailPrefix
        }
      }
    });
  });

  afterEach(async () => {
    // Clean up all test data created by this test suite
    await prisma.admin.deleteMany({
      where: {
        email: {
          startsWith: testEmailPrefix
        }
      }
    });
  });

  it('should clean up expired challenges', async () => {
    // Create test admin with expired challenge in a single operation
    const testEmail = `${testEmailPrefix}-expired-challenge@test.com`;

    // First ensure no leftover test data
    await prisma.admin.deleteMany({ where: { email: testEmail } });

    // Create admin with expired challenge
    const testAdmin = await prisma.admin.create({
      data: {
        email: testEmail,
        name: 'Test Admin',
        role: 'admin',
        isActive: true,
        currentChallenge: 'test-challenge',
        challengeExpiresAt: new Date(Date.now() - 1000) // 1 second ago
      }
    });

    // Run cleanup
    const count = await cleanupExpiredChallenges(prisma);

    expect(count).toBe(1);

    // Verify challenge was cleared by re-querying from database
    const admin = await prisma.admin.findUnique({
      where: { id: testAdmin.id }
    });

    expect(admin).not.toBeNull();
    expect(admin.currentChallenge).toBeNull();
    expect(admin.challengeExpiresAt).toBeNull();
  });

  it('should not clean up valid challenges', async () => {
    // Create test admin with valid challenge in a single operation
    const testEmail = `${testEmailPrefix}-valid-challenge@test.com`;

    // First ensure no leftover test data
    await prisma.admin.deleteMany({ where: { email: testEmail } });

    // Create admin with valid challenge
    const testAdmin = await prisma.admin.create({
      data: {
        email: testEmail,
        name: 'Test Admin',
        role: 'admin',
        isActive: true,
        currentChallenge: 'test-challenge',
        challengeExpiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now
      }
    });

    // Run cleanup
    const count = await cleanupExpiredChallenges(prisma);

    expect(count).toBe(0);

    // Verify challenge is still there
    const admin = await prisma.admin.findUnique({
      where: { id: testAdmin.id }
    });

    expect(admin).not.toBeNull();
    expect(admin.currentChallenge).toBe('test-challenge');
    expect(admin.challengeExpiresAt).not.toBeNull();
  });

  it('should return 0 when no expired challenges exist', async () => {
    // No test data created - should find nothing to cleanup
    const count = await cleanupExpiredChallenges(prisma);
    expect(count).toBe(0);
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
      challengeExpiresAt: new Date(Date.now() - 1000) // 1 second ago
    };

    expect(isValidChallenge(admin)).toBe(false);
  });

  it('should return true when challenge is valid', () => {
    const admin = {
      currentChallenge: 'test-challenge',
      challengeExpiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes from now
    };

    expect(isValidChallenge(admin)).toBe(true);
  });
});
