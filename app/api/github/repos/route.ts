import { NextRequest, NextResponse } from 'next/server';
import { createGitHubClient } from '@/lib/github/client';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * GET /api/github/repos
 * Fetch user's GitHub repositories
 *
 * Query params:
 * - page: number (optional, default: 1)
 * - perPage: number (optional, default: 30)
 * - sort: 'created' | 'updated' | 'pushed' | 'full_name' (optional, default: 'updated')
 * - direction: 'asc' | 'desc' (optional, default: 'desc')
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Replace with proper NextAuth session when auth is implemented
    // For now, accept userId from header or query param
    const userId = request.headers.get('x-user-id') || request.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User authentication required' },
        { status: 401 }
      );
    }

    // Get GitHub access token from database
    const account = await prisma.account.findFirst({
      where: {
        userId,
        provider: 'github',
      },
      select: {
        access_token: true,
        expires_at: true,
      },
    });

    if (!account || !account.access_token) {
      return NextResponse.json(
        {
          error: 'GitHub account not connected',
          message: 'Please connect your GitHub account to access repositories',
        },
        { status: 403 }
      );
    }

    // Check if token is expired
    if (account.expires_at && account.expires_at * 1000 < Date.now()) {
      return NextResponse.json(
        {
          error: 'GitHub token expired',
          message: 'Please reconnect your GitHub account',
        },
        { status: 401 }
      );
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('perPage') || '30', 10);
    const sort = (searchParams.get('sort') || 'updated') as 'created' | 'updated' | 'pushed' | 'full_name';
    const direction = (searchParams.get('direction') || 'desc') as 'asc' | 'desc';

    // Create GitHub client and fetch repos
    const client = await createGitHubClient(account.access_token, userId);
    const result = await client.getRepositories({
      page,
      perPage,
      sort,
      direction,
    });

    return NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error: any) {
    console.error('Error fetching GitHub repositories:', error);

    // Handle specific error types
    if (error.message.includes('invalid or expired')) {
      return NextResponse.json(
        {
          error: 'Authentication failed',
          message: error.message,
        },
        { status: 401 }
      );
    }

    if (error.message.includes('rate limit')) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: 'GitHub API rate limit exceeded. Please try again later.',
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch repositories',
        message: error.message || 'An unexpected error occurred',
      },
      { status: 500 }
    );
  }
}
