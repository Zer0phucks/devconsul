import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Middleware helper to get authenticated user from request
 * Returns user object or null if not authenticated
 */
export async function getAuthUser(request?: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}

/**
 * Middleware helper to require authentication
 * Returns user or throws 401 response
 */
export async function requireAuthUser(request?: NextRequest) {
  const user = await getAuthUser(request)

  if (!user) {
    throw new Error('Unauthorized')
  }

  return user
}

/**
 * API route wrapper that requires authentication
 * Usage: export const GET = withAuth(async (request, user) => { ... })
 */
export function withAuth<T extends any[]>(
  handler: (request: NextRequest, user: any, ...params: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...params: T): Promise<NextResponse> => {
    try {
      const user = await getAuthUser(request)

      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      return await handler(request, user, ...params)
    } catch (error: any) {
      if (error.message === 'Unauthorized') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      throw error
    }
  }
}

/**
 * Get session-like object for backward compatibility
 */
export async function getSession() {
  const user = await getAuthUser()

  if (!user) {
    return null
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.name || user.email,
    },
  }
}
