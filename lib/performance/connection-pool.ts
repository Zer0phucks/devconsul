/**
 * Database Connection Pool Configuration
 *
 * Optimizes Prisma connection pooling for Vercel/PostgreSQL:
 * - Connection pool sizing
 * - Connection timeout settings
 * - Read replica configuration (preparation)
 * - Connection health monitoring
 */

import { PrismaClient } from '@prisma/client';

/**
 * Connection pool configuration
 *
 * Based on Vercel/Neon PostgreSQL best practices:
 * - Serverless environments need smaller pools
 * - Each Vercel function gets its own connection
 * - Pool size should be: (total_connections / number_of_concurrent_functions)
 */
export const CONNECTION_POOL_CONFIG = {
  // Connection pool size
  // Default Neon allows 100 connections, Vercel recommends 5-10 per serverless function
  connectionLimit: process.env.DATABASE_CONNECTION_LIMIT
    ? parseInt(process.env.DATABASE_CONNECTION_LIMIT)
    : 10,

  // Connection timeout (milliseconds)
  poolTimeout: process.env.DATABASE_POOL_TIMEOUT
    ? parseInt(process.env.DATABASE_POOL_TIMEOUT)
    : 30000, // 30 seconds

  // Query timeout (milliseconds)
  queryTimeout: process.env.DATABASE_QUERY_TIMEOUT
    ? parseInt(process.env.DATABASE_QUERY_TIMEOUT)
    : 15000, // 15 seconds

  // Maximum wait time for a connection
  connectTimeout: process.env.DATABASE_CONNECT_TIMEOUT
    ? parseInt(process.env.DATABASE_CONNECT_TIMEOUT)
    : 10000, // 10 seconds
} as const;

/**
 * Create Prisma client with optimized settings
 */
export function createPrismaClient() {
  const client = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

  return client;
}

/**
 * Connection pool health check
 */
export async function checkConnectionPoolHealth(
  prisma: PrismaClient
): Promise<{
  healthy: boolean;
  activeConnections?: number;
  error?: string;
}> {
  try {
    // Simple query to test connection
    await prisma.$queryRaw`SELECT 1`;

    // Note: Prisma doesn't expose pool metrics directly
    // This is a basic health check
    return {
      healthy: true,
    };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get connection pool statistics (when available)
 *
 * Note: Prisma Client doesn't expose detailed pool metrics
 * This is a placeholder for future implementation or external monitoring
 */
export interface PoolStats {
  total: number;
  active: number;
  idle: number;
  waiting: number;
}

export async function getPoolStats(): Promise<PoolStats | null> {
  // Prisma doesn't expose these metrics directly
  // You would need to use Prisma's metrics endpoint or external monitoring
  return null;
}

/**
 * Read replica configuration (preparation)
 *
 * Prisma supports read replicas through connection URLs
 * This configuration prepares for future read replica setup
 */
export const READ_REPLICA_CONFIG = {
  // Queries that can use read replicas
  readQueries: [
    'findMany',
    'findUnique',
    'findFirst',
    'count',
    'aggregate',
    'groupBy',
  ] as const,

  // Queries that must use primary
  writeQueries: [
    'create',
    'createMany',
    'update',
    'updateMany',
    'upsert',
    'delete',
    'deleteMany',
  ] as const,
};

/**
 * Create read-only Prisma client (for read replicas)
 */
export function createReadReplicaClient(): PrismaClient | null {
  const readReplicaUrl = process.env.DATABASE_READ_REPLICA_URL;

  if (!readReplicaUrl) {
    return null; // No read replica configured
  }

  return new PrismaClient({
    datasources: {
      db: {
        url: readReplicaUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'],
  });
}

/**
 * Query router: decides which client to use based on query type
 */
export function shouldUseReadReplica(operation: string): boolean {
  return READ_REPLICA_CONFIG.readQueries.includes(operation as any);
}

/**
 * Connection pool monitoring middleware
 */
export function enableConnectionMonitoring(prisma: PrismaClient) {
  if (process.env.NODE_ENV !== 'development') return;

  let queryCount = 0;
  let connectionErrors = 0;

  prisma.$use(async (params, next) => {
    queryCount++;

    try {
      const result = await next(params);
      return result;
    } catch (error) {
      connectionErrors++;

      // Log connection errors
      if (error instanceof Error && error.message.includes('connection')) {
        console.error('[CONNECTION ERROR]', {
          count: connectionErrors,
          totalQueries: queryCount,
          error: error.message,
        });
      }

      throw error;
    }
  });

  // Log stats periodically
  if (process.env.NODE_ENV === 'development') {
    setInterval(() => {
      console.log('[CONNECTION STATS]', {
        totalQueries: queryCount,
        connectionErrors,
        errorRate: connectionErrors > 0 ? (connectionErrors / queryCount) * 100 : 0,
      });
    }, 60000); // Every minute
  }
}

/**
 * Graceful shutdown handler
 */
export async function gracefulShutdown(prisma: PrismaClient): Promise<void> {
  try {
    await prisma.$disconnect();
    console.log('Database connections closed gracefully');
  } catch (error) {
    console.error('Error during database disconnect:', error);
    throw error;
  }
}

/**
 * Connection retry logic
 */
export async function connectWithRetry(
  prisma: PrismaClient,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await prisma.$connect();
      console.log(`Database connected successfully on attempt ${attempt}`);
      return true;
    } catch (error) {
      console.error(`Connection attempt ${attempt} failed:`, error);

      if (attempt < maxRetries) {
        console.log(`Retrying in ${delayMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  return false;
}

/**
 * Prisma Client Extensions for connection pooling
 *
 * Example usage:
 * const prisma = new PrismaClient().$extends(connectionPoolExtension);
 */
export const connectionPoolExtension = {
  name: 'connection-pool',
  query: {
    async $allOperations({ operation, model, args, query }: any) {
      const start = performance.now();

      try {
        const result = await query(args);
        const duration = performance.now() - start;

        // Log slow queries
        if (duration > 100) {
          console.warn(`[SLOW QUERY] ${model}.${operation} took ${duration.toFixed(2)}ms`);
        }

        return result;
      } catch (error) {
        const duration = performance.now() - start;
        console.error(
          `[QUERY ERROR] ${model}.${operation} failed after ${duration.toFixed(2)}ms`,
          error
        );
        throw error;
      }
    },
  },
};
