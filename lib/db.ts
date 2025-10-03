/**
 * Database client utility with connection pooling
 * Implements singleton pattern for Prisma client to prevent connection exhaustion
 *
 * Features:
 * - Global singleton instance for development hot reloading
 * - Production-ready connection pooling
 * - Type-safe database client
 * - Graceful shutdown handling
 */

import { PrismaClient } from '@prisma/client';

// Define global type for development mode
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Prisma client options for optimal performance
const prismaClientOptions = {
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn'] as const
    : ['error'] as const,

  // Connection pooling configuration
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
};

/**
 * Singleton Prisma client instance
 * Prevents multiple instances in development due to hot reloading
 */
export const db = globalForPrisma.prisma ?? new PrismaClient(prismaClientOptions);

// Store instance in global for development hot reloading
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}

/**
 * Graceful shutdown handler
 * Ensures all database connections are properly closed
 */
export async function disconnectDb() {
  await db.$disconnect();
}

/**
 * Health check utility
 * Tests database connectivity
 */
export async function checkDbConnection() {
  try {
    await db.$queryRaw`SELECT 1`;
    return { status: 'healthy', message: 'Database connection successful' };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Database connection failed'
    };
  }
}

/**
 * Transaction helper with automatic retry logic
 * @param fn - Transaction function to execute
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 */
export async function executeTransaction<T>(
  fn: (tx: PrismaClient) => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await db.$transaction(async (tx) => {
        return await fn(tx as PrismaClient);
      });
    } catch (error) {
      lastError = error as Error;

      // Don't retry on validation errors
      if (error instanceof Error && error.message.includes('Unique constraint')) {
        throw error;
      }

      // Exponential backoff before retry
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
      }
    }
  }

  throw lastError || new Error('Transaction failed after maximum retries');
}

// Export Prisma types for convenience
export type { Prisma } from '@prisma/client';
export * from '@prisma/client';
