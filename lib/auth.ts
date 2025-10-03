import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * Get the current authenticated user
 * Returns user or redirects to login if not authenticated
 */
export async function requireAuth() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return user
}

/**
 * Get the current authenticated user (nullable)
 * Returns user or null if not authenticated
 */
export async function getUser() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}

/**
 * Get the current session
 */
export async function getSession() {
  const supabase = await createClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  return session
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

/**
 * Sign in with email and password
 */
export async function signInWithPassword(email: string, password: string) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    throw error
  }

  return data
}

/**
 * Sign up with email and password
 */
export async function signUpWithPassword(email: string, password: string, metadata?: {
  name?: string
  [key: string]: any
}) {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  })

  if (error) {
    throw error
  }

  return data
}

/**
 * Reset password for email
 */
export async function resetPasswordForEmail(email: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password`,
  })

  if (error) {
    throw error
  }
}

/**
 * Update user password
 */
export async function updatePassword(newPassword: string) {
  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    throw error
  }
}

/**
 * Update user metadata
 */
export async function updateUserMetadata(metadata: {
  name?: string
  [key: string]: any
}) {
  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({
    data: metadata,
  })

  if (error) {
    throw error
  }
}
