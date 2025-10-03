# Authentication System Setup Guide

This guide explains how to configure and use the NextAuth.js authentication system.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the required values:

```bash
cp .env.example .env.local
```

### Required Variables

1. **DATABASE_URL**: PostgreSQL connection string
   - Format: `postgresql://user:password@host:port/database`
   - Example: `postgresql://postgres:password@localhost:5432/fullselfpublishing`

2. **NEXTAUTH_URL**: Your application URL
   - Development: `http://localhost:3000`
   - Production: `https://yourdomain.com`

3. **NEXTAUTH_SECRET**: Random secret key (minimum 32 characters)
   - Generate with: `openssl rand -base64 32`
   - Or use: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

### OAuth Providers (Optional but Recommended)

#### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Go to Credentials > Create Credentials > OAuth 2.0 Client ID
5. Set authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`
6. Copy Client ID and Client Secret to `.env.local`

```
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
```

#### GitHub OAuth Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in application details:
   - Application name: Your app name
   - Homepage URL: `http://localhost:3000` (dev) or your production URL
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID and generate Client Secret
5. Add to `.env.local`:

```
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
```

## Database Setup

The authentication system requires the following Prisma schema (should be in `prisma/schema.prisma`):

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  password      String?
  accounts      Account[]
  sessions      Session[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

Run migrations:

```bash
npm run db:migrate
```

## Features

### Email/Password Authentication
- Signup: `/signup`
- Login: `/login`
- Password requirements: Minimum 8 characters
- Passwords hashed with bcrypt (12 rounds)

### OAuth Authentication
- Google Sign In
- GitHub Sign In
- Automatic account linking by email

### Protected Routes
Routes protected by middleware (requires authentication):
- `/admin/*`
- `/settings/*`
- `/dashboard/*`
- `/api/projects/*`
- `/api/content/*`

### Session Management
- Strategy: JWT
- Session duration: 30 days
- Automatic session refresh
- CSRF protection (built-in)

### Security Features
- Password hashing with bcrypt
- Secure session cookies (httpOnly, secure, sameSite)
- CSRF protection
- Email validation
- Password strength requirements

## Usage Examples

### Client-Side Authentication

```typescript
import { signIn, signOut, useSession } from "next-auth/react";

// Check authentication status
const { data: session, status } = useSession();

// Sign in with credentials
await signIn("credentials", {
  email: "user@example.com",
  password: "password123",
  callbackUrl: "/admin"
});

// Sign in with OAuth
await signIn("google", { callbackUrl: "/admin" });
await signIn("github", { callbackUrl: "/admin" });

// Sign out
await signOut({ callbackUrl: "/login" });
```

### Server-Side Authentication

```typescript
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// In API routes or Server Components
const session = await getServerSession(authOptions);

if (!session) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

const userEmail = session.user?.email;
```

### Protecting Client Components

```typescript
"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export default function ProtectedPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/login");
    },
  });

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  return <div>Protected content for {session.user.name}</div>;
}
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/signin` - Sign in (handled by NextAuth)
- `POST /api/auth/signout` - Sign out (handled by NextAuth)
- `GET /api/auth/session` - Get current session (handled by NextAuth)

### User Management
- `PATCH /api/user/profile` - Update user profile (name, email)
- `PATCH /api/user/password` - Change password

## Troubleshooting

### "Invalid credentials" error
- Check email/password are correct
- Verify user exists in database
- Check password was hashed correctly during signup

### OAuth not working
- Verify CLIENT_ID and CLIENT_SECRET are correct
- Check callback URLs match exactly (including http/https)
- Ensure OAuth app is enabled in provider console
- Check NEXTAUTH_URL matches your domain

### Session not persisting
- Verify NEXTAUTH_SECRET is set and consistent
- Check cookies are enabled in browser
- Verify NEXTAUTH_URL matches current domain

### Database connection errors
- Verify DATABASE_URL is correct
- Check database is running
- Ensure migrations have been run
- Verify database user has correct permissions

## Next Steps

1. Customize auth pages styling to match your brand
2. Add password reset flow (email-based)
3. Implement email verification
4. Add two-factor authentication (2FA)
5. Configure rate limiting for auth endpoints
6. Set up monitoring for failed login attempts

## Security Best Practices

1. Always use HTTPS in production
2. Rotate NEXTAUTH_SECRET regularly
3. Implement rate limiting on auth endpoints
4. Monitor for suspicious login patterns
5. Use strong password requirements
6. Implement account lockout after failed attempts
7. Enable 2FA for admin accounts
8. Regular security audits

## Support

For issues or questions:
- NextAuth.js docs: https://next-auth.js.org/
- Prisma docs: https://www.prisma.io/docs/
- GitHub Issues: [Your repository]
