# DevConsul MVP Development Tasks

**Project**: DevConsul - Developer Authority & Engagement Platform
**Goal**: Launch MVP with unified inbox, pain point extraction, GitHub integration, devlog automation, and analytics
**Timeline**: 10 weeks
**Status**: 🔴 Not Started

---

## 📍 HOW TO RESUME WORK AFTER CONTEXT CLEAR

1. Read this TASKS.md file completely
2. Check the **CURRENT STATUS** section below
3. Find tasks marked `[ ]` (not started) or `[~]` (in progress)
4. Review the **Context & Dependencies** for that phase
5. Continue from the first incomplete task
6. Update checkboxes as you complete tasks: `[ ]` → `[x]`
7. Update **CURRENT STATUS** section when switching phases

---

## 📊 CURRENT STATUS

**Current Phase**: Phase 1 - Foundation & Infrastructure
**Last Completed Task**: Task 1.2.3 - Database schema files created
**Next Task**: Task 1.2.1 - Create Supabase project (manual)
**Blockers**: Tasks 1.2.1, 1.2.5, 1.2.6 require manual Supabase dashboard work
**Notes**: Supabase client setup complete, schema files ready for execution

---

## 🎯 MVP SCOPE REMINDER

**INCLUDED IN MVP**:

- ✅ Unified inbox (Reddit, LinkedIn, Twitter)
- ✅ Pain point extraction (NLP)
- ✅ GitHub integration (webhooks, issue creation)
- ✅ Devlog automation (Twitter)
- ✅ Basic analytics dashboard

**DEFERRED TO v2**:

- ⏸️ Weekly newsletter (Resend)
- ⏸️ Integrated blog
- ⏸️ Advanced sentiment analysis
- ⏸️ Content curation features

---

## PHASE 1: FOUNDATION & INFRASTRUCTURE

**Duration**: Week 1
**Status**: 🔴 Not Started
**Context**: Set up core project structure, tooling, and deployment pipeline

### Dependencies:

- Node.js 18+ installed
- GitHub account with repo access
- Vercel account
- Supabase account
- Sentry account

### 1.1 Project Initialization

#### [x] 1.1.1 Initialize Next.js project

- [x] Run `npx create-next-app@latest devconsul --typescript --tailwind --app --src-dir`
- [x] Confirm selections: TypeScript=Yes, ESLint=Yes, Tailwind CSS=Yes, src/ directory=Yes, App Router=Yes, import alias=@/\*
- [x] Verify project structure created
- [x] Run `npm run dev` to confirm app starts

#### [x] 1.1.2 Configure development tooling

- [x] Install Prettier: `npm install -D prettier eslint-config-prettier`
- [x] Create `.prettierrc.json`:
  ```json
  {
    "semi": false,
    "singleQuote": true,
    "tabWidth": 2,
    "trailingComma": "es5"
  }
  ```
- [x] Create `.prettierignore`: Add `.next/`, `node_modules/`, `.vercel/`
- [x] Update `eslint.config.mjs` to extend prettier
- [x] Install Husky: `npm install -D husky lint-staged`
- [x] Run `npx husky init`
- [x] Configure `.husky/pre-commit`: Add `npx lint-staged`
- [x] Add to `package.json`:
  ```json
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": ["prettier --write", "eslint --fix"],
    "*.{json,md}": ["prettier --write"]
  }
  ```

#### [x] 1.1.3 Setup shadcn/ui

- [x] Run `npx shadcn-ui@latest init`
- [x] Select: Default style, Neutral color, CSS variables=Yes
- [x] Install initial components: `npx shadcn-ui@latest add button card input label`
- [x] Verify `components/ui/` directory created
- [x] Test button component in a test page

#### [x] 1.1.4 Environment configuration

- [x] Create `.env.local` file (gitignored)
- [x] Create `.env.example` file with template:

  ```bash
  # Supabase
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_ANON_KEY=
  SUPABASE_SERVICE_ROLE_KEY=

  # Social OAuth (to be added later)
  REDDIT_CLIENT_ID=
  REDDIT_CLIENT_SECRET=
  LINKEDIN_CLIENT_ID=
  LINKEDIN_CLIENT_SECRET=
  TWITTER_CLIENT_ID=
  TWITTER_CLIENT_SECRET=

  # GitHub (to be added later)
  GITHUB_APP_ID=
  GITHUB_CLIENT_ID=
  GITHUB_CLIENT_SECRET=
  GITHUB_WEBHOOK_SECRET=
  GITHUB_PRIVATE_KEY=

  # Inngest (to be added later)
  INNGEST_EVENT_KEY=
  INNGEST_SIGNING_KEY=

  # Sentry (to be added later)
  SENTRY_DSN=
  SENTRY_AUTH_TOKEN=

  # OpenAI (to be added later)
  OPENAI_API_KEY=
  ```

- [x] Add `.env.local` to `.gitignore`
- [x] Document environment setup in README.md

### 1.2 Supabase Setup

#### [ ] 1.2.1 Create Supabase project

- [ ] Go to https://supabase.com/dashboard
- [ ] Click "New Project"
- [ ] Name: "devconsul-mvp"
- [ ] Generate strong database password (save to password manager)
- [ ] Select region closest to primary users
- [ ] Wait for project provisioning (~2 minutes)
- [ ] Copy Project URL and anon key to `.env.local`

#### [x] 1.2.2 Install Supabase client

- [x] Run `npm install @supabase/supabase-js @supabase/ssr`
- [x] Create `src/lib/supabase/client.ts`:

  ```typescript
  import { createBrowserClient } from '@supabase/ssr'

  export function createClient() {
    return createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  ```

- [x] Create `src/lib/supabase/server.ts`:

  ```typescript
  import { createServerClient } from '@supabase/ssr'
  import { cookies } from 'next/headers'

  export async function createClient() {
    const cookieStore = await cookies()
    return createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )
  }
  ```

- [x] Create `src/lib/supabase/middleware.ts` for auth middleware

#### [x] 1.2.3 Initialize database schema

- [x] Go to Supabase Dashboard → SQL Editor
- [x] Create migration file: `migrations/001_initial_schema.sql`
- [x] Add schema:

  ```sql
  -- Enable UUID extension
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

  -- Users table (extends Supabase auth.users)
  CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Social connections
  CREATE TABLE public.social_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('reddit', 'linkedin', 'twitter')),
    platform_user_id TEXT,
    platform_username TEXT,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, platform)
  );

  -- Pain points
  CREATE TABLE public.pain_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    source_platform TEXT NOT NULL CHECK (source_platform IN ('reddit', 'linkedin', 'twitter')),
    source_url TEXT,
    content TEXT NOT NULL,
    extracted_summary TEXT,
    sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
    sentiment_score DECIMAL(3,2),
    category TEXT,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'approved', 'rejected', 'resolved')),
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- GitHub repositories
  CREATE TABLE public.github_repos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    repo_name TEXT NOT NULL,
    repo_full_name TEXT NOT NULL,
    installation_id TEXT,
    webhook_secret TEXT,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, repo_full_name)
  );

  -- GitHub issues (linked to pain points)
  CREATE TABLE public.github_issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pain_point_id UUID REFERENCES public.pain_points(id) ON DELETE CASCADE,
    repo_id UUID REFERENCES public.github_repos(id) ON DELETE CASCADE,
    issue_number INTEGER NOT NULL,
    issue_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'merged')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Devlog posts
  CREATE TABLE public.devlog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    platform TEXT NOT NULL DEFAULT 'twitter' CHECK (platform IN ('twitter')),
    platform_post_id TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'failed')),
    scheduled_for TIMESTAMP WITH TIME ZONE,
    published_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Analytics events
  CREATE TABLE public.analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    event_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Create indexes
  CREATE INDEX idx_social_connections_user_id ON public.social_connections(user_id);
  CREATE INDEX idx_pain_points_user_id ON public.pain_points(user_id);
  CREATE INDEX idx_pain_points_status ON public.pain_points(status);
  CREATE INDEX idx_pain_points_created_at ON public.pain_points(created_at DESC);
  CREATE INDEX idx_github_repos_user_id ON public.github_repos(user_id);
  CREATE INDEX idx_github_issues_pain_point_id ON public.github_issues(pain_point_id);
  CREATE INDEX idx_devlog_posts_user_id ON public.devlog_posts(user_id);
  CREATE INDEX idx_devlog_posts_status ON public.devlog_posts(status);
  CREATE INDEX idx_analytics_events_user_id ON public.analytics_events(user_id);
  CREATE INDEX idx_analytics_events_created_at ON public.analytics_events(created_at DESC);
  ```

- [ ] Execute migration in Supabase SQL Editor (manual step)
- [ ] Verify all tables created in Table Editor (manual step)

#### [x] 1.2.4 Setup Row Level Security (RLS)

- [x] Enable RLS on all tables
- [x] Create RLS policies:

  ```sql
  -- Profiles: Users can read/update own profile
  ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
  CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

  -- Social connections: Users can manage own connections
  ALTER TABLE public.social_connections ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users can view own connections" ON public.social_connections FOR SELECT USING (auth.uid() = user_id);
  CREATE POLICY "Users can insert own connections" ON public.social_connections FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users can update own connections" ON public.social_connections FOR UPDATE USING (auth.uid() = user_id);
  CREATE POLICY "Users can delete own connections" ON public.social_connections FOR DELETE USING (auth.uid() = user_id);

  -- Pain points: Users can manage own pain points
  ALTER TABLE public.pain_points ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users can view own pain points" ON public.pain_points FOR SELECT USING (auth.uid() = user_id);
  CREATE POLICY "Users can insert own pain points" ON public.pain_points FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users can update own pain points" ON public.pain_points FOR UPDATE USING (auth.uid() = user_id);
  CREATE POLICY "Users can delete own pain points" ON public.pain_points FOR DELETE USING (auth.uid() = user_id);

  -- GitHub repos: Users can manage own repos
  ALTER TABLE public.github_repos ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Users can view own repos" ON public.github_repos FOR SELECT USING (auth.uid() = user_id);
  CREATE POLICY "Users can insert own repos" ON public.github_repos FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users can update own repos" ON public.github_repos FOR UPDATE USING (auth.uid() = user_id);
  CREATE POLICY "Users can delete own repos" ON public.github_repos FOR DELETE USING (auth.uid() = user_id);

  -- Apply similar policies to other tables
  ```

- [ ] Test RLS policies with test user (manual step after Supabase setup)
- [x] Document RLS policies in `docs/database.md`

#### [ ] 1.2.5 Configure Supabase Auth

- [ ] Go to Authentication → Settings
- [ ] Configure email templates (Welcome, Reset Password)
- [ ] Set Site URL to `http://localhost:3000` (dev) and production URL later
- [ ] Enable email confirmations
- [ ] Configure password requirements (min 8 chars, etc.)
- [ ] Test signup flow manually

#### [ ] 1.2.6 Setup realtime subscriptions

- [ ] Enable Realtime for relevant tables (pain_points, devlog_posts)
- [ ] Go to Database → Replication
- [ ] Enable replication for: `pain_points`, `social_connections`, `devlog_posts`
- [ ] Create test subscription in code to verify functionality
- [ ] Document subscription patterns in `docs/realtime.md`

### 1.3 CI/CD Pipeline

#### [ ] 1.3.1 Create GitHub repository

- [ ] Create new repo: `devconsul` on GitHub
- [ ] Initialize git: `git init`
- [ ] Add remote: `git remote add origin <repo-url>`
- [ ] Create initial commit with project structure
- [ ] Push to main: `git push -u origin main`
- [ ] Create `develop` branch: `git checkout -b develop && git push -u origin develop`

#### [ ] 1.3.2 Setup GitHub Actions workflows

- [ ] Create `.github/workflows/ci.yml`:

  ```yaml
  name: CI

  on:
    push:
      branches: [main, develop]
    pull_request:
      branches: [main, develop]

  jobs:
    lint:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with:
            node-version: '20'
            cache: 'npm'
        - run: npm ci
        - run: npm run lint

    test:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with:
            node-version: '20'
            cache: 'npm'
        - run: npm ci
        - run: npm run test
          env:
            CI: true

    build:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with:
            node-version: '20'
            cache: 'npm'
        - run: npm ci
        - run: npm run build
          env:
            NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
            NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
  ```

- [ ] Create `.github/workflows/deploy-production.yml` (triggered on main branch)
- [ ] Create `.github/workflows/deploy-staging.yml` (triggered on develop branch)
- [ ] Test workflows by pushing changes

#### [ ] 1.3.3 Setup Vercel project

- [ ] Go to https://vercel.com/new
- [ ] Import GitHub repository
- [ ] Configure project:
  - Framework Preset: Next.js
  - Root Directory: ./
  - Build Command: `npm run build`
  - Output Directory: `.next`
- [ ] Add environment variables from `.env.example`
- [ ] Create production and preview environments
- [ ] Configure custom domain (if available)
- [ ] Enable automatic deployments from GitHub

#### [ ] 1.3.4 Configure deployment secrets

- [ ] Add GitHub Secrets (Settings → Secrets and variables → Actions):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `VERCEL_TOKEN` (for deployments)
- [ ] Add Vercel Environment Variables:
  - All Supabase variables
  - All OAuth credentials (when available)
  - All API keys (when available)
- [ ] Test deployment to preview environment
- [ ] Verify environment variables loaded correctly

#### [ ] 1.3.5 Setup testing infrastructure

- [ ] Install testing libraries: `npm install -D vitest @testing-library/react @testing-library/jest-dom @vitejs/plugin-react jsdom`
- [ ] Create `vitest.config.ts`:

  ```typescript
  import { defineConfig } from 'vitest/config'
  import react from '@vitejs/plugin-react'
  import path from 'path'

  export default defineConfig({
    plugins: [react()],
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: ['node_modules/', 'src/test/'],
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  })
  ```

- [ ] Create `src/test/setup.ts` for test utilities
- [ ] Add test scripts to `package.json`:
  ```json
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
  ```
- [ ] Install Playwright: `npm install -D @playwright/test`
- [ ] Run `npx playwright install`
- [ ] Create `playwright.config.ts`
- [ ] Create sample E2E test in `tests/e2e/example.spec.ts`

### 1.4 Error Monitoring

#### [ ] 1.4.1 Setup Sentry account

- [ ] Go to https://sentry.io
- [ ] Create new organization/project: "devconsul"
- [ ] Select platform: Next.js
- [ ] Copy DSN to `.env.local`

#### [ ] 1.4.2 Install Sentry SDK

- [ ] Run Sentry wizard: `npx @sentry/wizard@latest -i nextjs`
- [ ] Confirm installation prompts
- [ ] Verify files created:
  - `sentry.client.config.ts`
  - `sentry.server.config.ts`
  - `sentry.edge.config.ts`
  - `next.config.js` updated with Sentry
- [ ] Update configs with proper environment variables

#### [ ] 1.4.3 Configure error boundaries

- [ ] Create `src/components/error-boundary.tsx`:

  ```typescript
  'use client'

  import * as Sentry from '@sentry/nextjs'
  import { useEffect } from 'react'

  export default function ErrorBoundary({
    error,
    reset,
  }: {
    error: Error & { digest?: string }
    reset: () => void
  }) {
    useEffect(() => {
      Sentry.captureException(error)
    }, [error])

    return (
      <div>
        <h2>Something went wrong!</h2>
        <button onClick={() => reset()}>Try again</button>
      </div>
    )
  }
  ```

- [ ] Add `error.tsx` files to route groups
- [ ] Test error boundary by throwing test error

#### [ ] 1.4.4 Setup performance monitoring

- [ ] Enable Sentry performance monitoring in config
- [ ] Set `tracesSampleRate: 0.1` for production
- [ ] Configure custom instrumentation for critical paths
- [ ] Test transaction tracking

#### [ ] 1.4.5 Configure alerting

- [ ] Go to Sentry → Alerts
- [ ] Create alert rule: "High Error Rate" (>10 errors/hour)
- [ ] Create alert rule: "New Issue" (for critical errors)
- [ ] Configure notification channels (email, Slack)
- [ ] Test alert by triggering error

### 1.5 Documentation & Project Structure

#### [ ] 1.5.1 Create documentation structure

- [ ] Create `docs/` directory
- [ ] Create `docs/architecture.md` (system architecture overview)
- [ ] Create `docs/database.md` (database schema and relationships)
- [ ] Create `docs/api.md` (API endpoints documentation)
- [ ] Create `docs/deployment.md` (deployment procedures)
- [ ] Create `docs/contributing.md` (contribution guidelines)

#### [ ] 1.5.2 Update README.md

- [ ] Add project description and tagline
- [ ] Add tech stack overview
- [ ] Add setup instructions
- [ ] Add development commands
- [ ] Add environment variables documentation
- [ ] Add deployment instructions
- [ ] Add troubleshooting section

#### [ ] 1.5.3 Create project structure documentation

- [ ] Document `src/` structure:
  ```
  src/
  ├── app/              # Next.js app router
  ├── components/       # React components
  │   ├── ui/          # shadcn/ui components
  │   └── features/    # Feature-specific components
  ├── lib/             # Utility libraries
  │   ├── supabase/   # Supabase clients
  │   ├── auth/       # Auth utilities
  │   └── utils/      # General utilities
  ├── hooks/           # Custom React hooks
  ├── types/           # TypeScript types
  └── test/            # Test utilities
  ```
- [ ] Document coding conventions
- [ ] Document commit message format

#### [ ] 1.5.4 Phase 1 completion checklist

- [ ] All tasks in Phase 1 completed
- [ ] Tests passing in CI/CD
- [ ] Successfully deployed to Vercel preview
- [ ] Sentry receiving events
- [ ] Documentation up to date
- [ ] Update **CURRENT STATUS** section to Phase 2

---

## PHASE 2: AUTHENTICATION & CORE UI

**Duration**: Week 2
**Status**: 🔴 Not Started
**Context**: Build authentication system and core dashboard UI

### Dependencies:

- Phase 1 completed (Supabase setup, Next.js initialized)
- shadcn/ui components installed
- Environment variables configured

### 2.1 Authentication System

#### [ ] 2.1.1 Setup authentication utilities

- [ ] Create `src/lib/auth/server.ts`:

  ```typescript
  import { createClient } from '@/lib/supabase/server'

  export async function getSession() {
    const supabase = await createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    return session
  }

  export async function getUser() {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user
  }
  ```

- [ ] Create `src/lib/auth/client.ts` for client-side auth utilities
- [ ] Create `src/hooks/use-auth.ts` custom hook
- [ ] Create TypeScript types in `src/types/auth.ts`

#### [ ] 2.1.2 Build authentication pages

- [ ] Create `src/app/(auth)/login/page.tsx`:
  - Email/password login form
  - Form validation with zod
  - Error handling and display
  - "Forgot password?" link
  - "Sign up" link
- [ ] Create `src/app/(auth)/signup/page.tsx`:
  - Email/password signup form
  - Password strength indicator
  - Terms & conditions checkbox
  - Email confirmation message
- [ ] Create `src/app/(auth)/forgot-password/page.tsx`
- [ ] Create `src/app/(auth)/reset-password/page.tsx`
- [ ] Create `src/app/(auth)/layout.tsx` (centered auth layout)

#### [ ] 2.1.3 Implement authentication flows

- [ ] Implement login flow:
  ```typescript
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  ```
- [ ] Implement signup flow with profile creation:

  ```typescript
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  // Create profile
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({ id: authData.user!.id, email, full_name })
  ```

- [ ] Implement password reset flow
- [ ] Implement email confirmation handling
- [ ] Add redirect logic after authentication

#### [ ] 2.1.4 Create protected route middleware

- [ ] Create `src/middleware.ts`:

  ```typescript
  import { createServerClient } from '@supabase/ssr'
  import { NextResponse, type NextRequest } from 'next/server'

  export async function middleware(request: NextRequest) {
    // Auth middleware logic
  }

  export const config = {
    matcher: ['/dashboard/:path*', '/api/:path*'],
  }
  ```

- [ ] Implement session validation
- [ ] Add redirect to login for unauthenticated users
- [ ] Test protected routes

#### [ ] 2.1.5 Build user profile management

- [ ] Create `src/app/dashboard/settings/page.tsx`
- [ ] Build profile edit form:
  - Full name
  - Avatar upload (Supabase Storage)
  - Email (read-only)
  - Password change
- [ ] Implement avatar upload to Supabase Storage:
  - Create `avatars` bucket
  - Upload image
  - Update profile with avatar URL
- [ ] Implement profile update logic
- [ ] Add success/error notifications

#### [ ] 2.1.6 Session management

- [ ] Implement auto-refresh for expired tokens
- [ ] Add "Remember me" functionality
- [ ] Create logout functionality
- [ ] Handle concurrent sessions
- [ ] Test session persistence across page refreshes

### 2.2 Core Dashboard UI

#### [ ] 2.2.1 Create dashboard layout

- [ ] Create `src/app/dashboard/layout.tsx`:
  - Sidebar navigation
  - Top header with user menu
  - Mobile-responsive hamburger menu
  - Breadcrumb navigation
- [ ] Install additional shadcn components:
  ```bash
  npx shadcn-ui@latest add sheet navigation-menu avatar dropdown-menu
  ```
- [ ] Create `src/components/layout/sidebar.tsx`
- [ ] Create `src/components/layout/header.tsx`
- [ ] Create `src/components/layout/mobile-nav.tsx`

#### [ ] 2.2.2 Build sidebar navigation

- [ ] Create navigation items:
  - Dashboard (home)
  - Inbox (unified inbox)
  - Pain Points
  - GitHub Repos
  - Devlog
  - Analytics
  - Settings
- [ ] Add icons for each item (lucide-react)
- [ ] Implement active state highlighting
- [ ] Add collapse/expand functionality
- [ ] Make responsive (drawer on mobile)

#### [ ] 2.2.3 Create header component

- [ ] Add app logo/branding
- [ ] Add search bar (placeholder for now)
- [ ] Add notifications icon (placeholder)
- [ ] Add user avatar dropdown:
  - Profile
  - Settings
  - Logout
- [ ] Make sticky on scroll

#### [ ] 2.2.4 Build dashboard home page

- [ ] Create `src/app/dashboard/page.tsx`
- [ ] Add welcome message with user name
- [ ] Create stats cards:
  - Total pain points
  - Active social connections
  - GitHub issues created
  - Devlog posts published
- [ ] Install chart components:
  ```bash
  npx shadcn-ui@latest add chart
  ```
- [ ] Add placeholder charts:
  - Pain points over time (line chart)
  - Pain points by platform (pie chart)
  - Recent activity feed
- [ ] Create empty states with onboarding hints

#### [ ] 2.2.5 Build unified inbox page structure

- [ ] Create `src/app/dashboard/inbox/page.tsx`
- [ ] Create inbox layout:
  - Left: Message list
  - Right: Message detail view
- [ ] Install shadcn components:
  ```bash
  npx shadcn-ui@latest add separator scroll-area badge
  ```
- [ ] Create message list item component:
  - Platform icon
  - Author avatar
  - Message preview
  - Timestamp
  - Read/unread indicator
- [ ] Create message detail component:
  - Full content
  - Source link
  - Actions (mark as pain point, archive)
- [ ] Add empty state for no messages
- [ ] Add loading skeletons

#### [ ] 2.2.6 Implement responsive design

- [ ] Test on desktop (1920px, 1440px, 1024px)
- [ ] Test on tablet (768px)
- [ ] Test on mobile (375px, 414px)
- [ ] Implement mobile drawer for sidebar
- [ ] Adjust layouts for smaller screens
- [ ] Test touch interactions on mobile
- [ ] Ensure all interactive elements are accessible

#### [ ] 2.2.7 Add loading and error states

- [ ] Create `src/components/ui/loading-spinner.tsx`
- [ ] Create `src/components/ui/error-message.tsx`
- [ ] Add loading states to all pages
- [ ] Add error boundaries to route groups
- [ ] Create 404 page
- [ ] Create 500 error page
- [ ] Test error scenarios

### 2.3 Database Integration

#### [ ] 2.3.1 Create database utility functions

- [ ] Create `src/lib/db/profiles.ts`:

  ```typescript
  export async function getProfile(userId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    return { data, error }
  }

  export async function updateProfile(userId: string, updates: any) {
    // ...
  }
  ```

- [ ] Create `src/lib/db/social-connections.ts`
- [ ] Create `src/lib/db/pain-points.ts`
- [ ] Create `src/lib/db/github-repos.ts`
- [ ] Add TypeScript types for all database models

#### [ ] 2.3.2 Implement data fetching patterns

- [ ] Install React Query: `npm install @tanstack/react-query`
- [ ] Create `src/providers/query-provider.tsx`
- [ ] Create custom hooks:
  - `src/hooks/use-profile.ts`
  - `src/hooks/use-social-connections.ts`
  - `src/hooks/use-pain-points.ts`
  - `src/hooks/use-github-repos.ts`
- [ ] Implement optimistic updates
- [ ] Add error handling and retries

#### [ ] 2.3.3 Setup real-time subscriptions

- [ ] Create `src/hooks/use-realtime-pain-points.ts`:

  ```typescript
  export function useRealtimePainPoints(userId: string) {
    const queryClient = useQueryClient()

    useEffect(() => {
      const channel = supabase
        .channel('pain-points')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'pain_points',
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            queryClient.invalidateQueries(['pain-points'])
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }, [userId])
  }
  ```

- [ ] Create similar hooks for other real-time data
- [ ] Test real-time updates in UI

#### [ ] 2.3.4 Phase 2 completion checklist

- [ ] All authentication flows working
- [ ] Protected routes functioning correctly
- [ ] Dashboard UI responsive and accessible
- [ ] Database queries optimized
- [ ] Real-time updates working
- [ ] Tests written and passing
- [ ] Update **CURRENT STATUS** section to Phase 3

---

## PHASE 3: SOCIAL PLATFORM INTEGRATIONS

**Duration**: Week 3-4
**Status**: 🔴 Not Started
**Context**: Implement OAuth flows and API integrations for Reddit, LinkedIn, and Twitter

### Dependencies:

- Phase 2 completed (Auth system, Dashboard UI)
- Social platform developer accounts created
- OAuth credentials obtained

### 3.1 OAuth Setup & Configuration

#### [ ] 3.1.1 Create Reddit App

- [ ] Go to https://www.reddit.com/prefs/apps
- [ ] Create new app: "DevConsul"
- [ ] Select type: "web app"
- [ ] Set redirect URI: `http://localhost:3000/api/auth/callback/reddit`
- [ ] Copy Client ID and Secret to `.env.local`
- [ ] Add to `.env.example`

#### [ ] 3.1.2 Create LinkedIn App

- [ ] Go to https://www.linkedin.com/developers/apps
- [ ] Create new app: "DevConsul"
- [ ] Request "Sign In with LinkedIn" product
- [ ] Add redirect URI: `http://localhost:3000/api/auth/callback/linkedin`
- [ ] Copy Client ID and Secret to `.env.local`
- [ ] Add to `.env.example`

#### [ ] 3.1.3 Create Twitter/X App

- [ ] Go to https://developer.twitter.com/en/portal/dashboard
- [ ] Create new project and app: "DevConsul"
- [ ] Enable OAuth 2.0
- [ ] Set callback URL: `http://localhost:3000/api/auth/callback/twitter`
- [ ] Request elevated access (for posting tweets)
- [ ] Copy API Key, Secret, Bearer Token to `.env.local`
- [ ] Add to `.env.example`

#### [ ] 3.1.4 Install OAuth libraries

- [ ] Run `npm install @supabase/auth-helpers-nextjs arctic`
- [ ] Or use custom OAuth implementation
- [ ] Create `src/lib/oauth/` directory
- [ ] Create `src/lib/oauth/reddit.ts`
- [ ] Create `src/lib/oauth/linkedin.ts`
- [ ] Create `src/lib/oauth/twitter.ts`

### 3.2 Reddit Integration

#### [ ] 3.2.1 Implement Reddit OAuth flow

- [ ] Create `src/app/api/auth/reddit/route.ts`:

  ```typescript
  import { redirect } from 'next/navigation'

  export async function GET() {
    const authUrl = `https://www.reddit.com/api/v1/authorize?client_id=${process.env.REDDIT_CLIENT_ID}&response_type=code&state=${state}&redirect_uri=${redirectUri}&duration=permanent&scope=identity read mysubreddits submit privatemessages`
    redirect(authUrl)
  }
  ```

- [ ] Create `src/app/api/auth/callback/reddit/route.ts`:
  - Exchange code for access token
  - Fetch user info
  - Store connection in database
  - Redirect to dashboard
- [ ] Implement token refresh logic
- [ ] Add error handling

#### [ ] 3.2.2 Implement Reddit API client

- [ ] Create `src/lib/reddit/client.ts`:

  ```typescript
  export class RedditClient {
    constructor(private accessToken: string) {}

    async getMe() {
      const res = await fetch('https://oauth.reddit.com/api/v1/me', {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      })
      return res.json()
    }

    async getInbox(type: 'mentions' | 'messages') {
      // Fetch user inbox
    }

    async getComments(subreddit?: string) {
      // Fetch comments from subreddit
    }

    async searchMentions(username: string) {
      // Search for username mentions
    }
  }
  ```

- [ ] Implement rate limiting (60 requests/minute)
- [ ] Add retry logic with exponential backoff
- [ ] Create TypeScript types for Reddit API responses

#### [ ] 3.2.3 Build Reddit connection UI

- [ ] Create `src/app/dashboard/connections/page.tsx`
- [ ] Add "Connect Reddit" button
- [ ] Show connection status (connected/disconnected)
- [ ] Display connected account info (username, avatar)
- [ ] Add "Disconnect" functionality
- [ ] Show last sync timestamp

#### [ ] 3.2.4 Implement Reddit data fetching

- [ ] Create Inngest function for Reddit sync:

  ```typescript
  export const syncRedditInbox = inngest.createFunction(
    { id: 'sync-reddit-inbox' },
    { cron: '*/15 * * * *' }, // Every 15 minutes
    async ({ event, step }) => {
      const users = await step.run('get-users', async () => {
        return getUsersWithRedditConnections()
      })

      for (const user of users) {
        await step.run(`sync-${user.id}`, async () => {
          const client = new RedditClient(user.reddit_token)
          const messages = await client.getInbox('mentions')
          await saveToUnifiedInbox(user.id, messages, 'reddit')
        })
      }
    }
  )
  ```

- [ ] Save fetched data to `pain_points` or intermediate table
- [ ] Handle pagination for large result sets
- [ ] Implement deduplication logic

#### [ ] 3.2.5 Test Reddit integration

- [ ] Test OAuth connection flow
- [ ] Test token refresh
- [ ] Verify data appears in unified inbox
- [ ] Test disconnection flow
- [ ] Test error scenarios (revoked token, API down)

### 3.3 LinkedIn Integration

#### [ ] 3.3.1 Implement LinkedIn OAuth flow

- [ ] Create `src/app/api/auth/linkedin/route.ts`
- [ ] Create `src/app/api/auth/callback/linkedin/route.ts`:
  - Exchange code for access token
  - Fetch user profile
  - Store connection in database
- [ ] Implement token refresh (tokens expire after 60 days)
- [ ] Add error handling

#### [ ] 3.3.2 Implement LinkedIn API client

- [ ] Create `src/lib/linkedin/client.ts`:

  ```typescript
  export class LinkedInClient {
    constructor(private accessToken: string) {}

    async getProfile() {
      const res = await fetch('https://api.linkedin.com/v2/me', {
        headers: { Authorization: `Bearer ${this.accessToken}` },
      })
      return res.json()
    }

    async getPosts(authorId: string) {
      // Fetch user posts
    }

    async getComments(postId: string) {
      // Fetch comments on a post
    }

    async getShares() {
      // Fetch shares/mentions
    }
  }
  ```

- [ ] Implement rate limiting (per LinkedIn's limits)
- [ ] Add retry logic
- [ ] Create TypeScript types

#### [ ] 3.3.3 Build LinkedIn connection UI

- [ ] Add "Connect LinkedIn" button to connections page
- [ ] Show connection status
- [ ] Display connected profile (name, headline, photo)
- [ ] Add "Disconnect" functionality
- [ ] Show last sync timestamp

#### [ ] 3.3.4 Implement LinkedIn data fetching

- [ ] Create Inngest function for LinkedIn sync
- [ ] Fetch posts and comments
- [ ] Fetch mentions and shares
- [ ] Save to unified inbox
- [ ] Handle pagination
- [ ] Implement deduplication

#### [ ] 3.3.5 Test LinkedIn integration

- [ ] Test OAuth flow
- [ ] Test token refresh
- [ ] Verify data in inbox
- [ ] Test disconnection
- [ ] Test error scenarios

### 3.4 Twitter/X Integration

#### [ ] 3.4.1 Implement Twitter OAuth 2.0 flow

- [ ] Create `src/app/api/auth/twitter/route.ts`:
  - Generate PKCE challenge
  - Redirect to Twitter OAuth
- [ ] Create `src/app/api/auth/callback/twitter/route.ts`:
  - Exchange code for access token
  - Fetch user info
  - Store connection and tokens
- [ ] Implement token refresh
- [ ] Add error handling

#### [ ] 3.4.2 Implement Twitter API v2 client

- [ ] Create `src/lib/twitter/client.ts`:

  ```typescript
  export class TwitterClient {
    constructor(private bearerToken: string) {}

    async getMe() {
      const res = await fetch('https://api.twitter.com/2/users/me', {
        headers: { Authorization: `Bearer ${this.bearerToken}` },
      })
      return res.json()
    }

    async getMentions(userId: string) {
      // Fetch user mentions
    }

    async getTweets(userId: string) {
      // Fetch user tweets
    }

    async postTweet(text: string) {
      // Post a tweet (for devlog automation)
    }
  }
  ```

- [ ] Implement rate limiting (per Twitter's limits)
- [ ] Add retry logic
- [ ] Create TypeScript types

#### [ ] 3.4.3 Build Twitter connection UI

- [ ] Add "Connect Twitter" button
- [ ] Show connection status
- [ ] Display connected account (username, display name, avatar)
- [ ] Add "Disconnect" functionality
- [ ] Show last sync timestamp

#### [ ] 3.4.4 Implement Twitter data fetching

- [ ] Create Inngest function for Twitter sync:

  ```typescript
  export const syncTwitterMentions = inngest.createFunction(
    { id: 'sync-twitter-mentions' },
    { cron: '*/10 * * * *' }, // Every 10 minutes
    async ({ event, step }) => {
      const users = await step.run('get-users', async () => {
        return getUsersWithTwitterConnections()
      })

      for (const user of users) {
        await step.run(`sync-${user.id}`, async () => {
          const client = new TwitterClient(user.twitter_token)
          const mentions = await client.getMentions(user.twitter_user_id)
          await saveToUnifiedInbox(user.id, mentions, 'twitter')
        })
      }
    }
  )
  ```

- [ ] Save fetched data to inbox
- [ ] Handle pagination
- [ ] Implement deduplication

#### [ ] 3.4.5 Test Twitter integration

- [ ] Test OAuth flow
- [ ] Test token refresh
- [ ] Verify data in inbox
- [ ] Test tweet posting (for devlog)
- [ ] Test disconnection
- [ ] Test error scenarios

### 3.5 Unified Inbox Implementation

#### [ ] 3.5.1 Create unified inbox data model

- [ ] Create `src/lib/db/inbox.ts`:

  ```typescript
  export async function getInboxMessages(
    userId: string,
    filters?: {
      platform?: 'reddit' | 'linkedin' | 'twitter'
      status?: 'read' | 'unread'
      limit?: number
    }
  ) {
    // Fetch messages from pain_points table
  }

  export async function markAsRead(messageId: string) {
    // Update status
  }

  export async function archiveMessage(messageId: string) {
    // Archive message
  }
  ```

- [ ] Add indexes for performance
- [ ] Implement full-text search

#### [ ] 3.5.2 Build inbox UI components

- [ ] Update `src/app/dashboard/inbox/page.tsx`:
  - Fetch real messages from database
  - Display platform-specific icons/badges
  - Show message metadata (author, timestamp, platform)
  - Implement infinite scroll/pagination
- [ ] Add filtering:
  - By platform (Reddit, LinkedIn, Twitter)
  - By status (read, unread, archived)
  - By date range
- [ ] Add sorting (newest first, oldest first, by platform)
- [ ] Add search functionality

#### [ ] 3.5.3 Implement real-time updates

- [ ] Subscribe to pain_points table changes
- [ ] Update inbox UI when new messages arrive
- [ ] Show notification badge for unread messages
- [ ] Add sound/toast notification (optional)

#### [ ] 3.5.4 Build message detail view

- [ ] Show full message content
- [ ] Show author profile (avatar, name, platform)
- [ ] Add "Open on [Platform]" link
- [ ] Add action buttons:
  - Mark as pain point
  - Archive
  - Mark as read/unread
- [ ] Show conversation thread (if applicable)

#### [ ] 3.5.5 Add bulk actions

- [ ] Multi-select messages
- [ ] Bulk mark as read
- [ ] Bulk archive
- [ ] Bulk tag as pain point
- [ ] Bulk delete (soft delete)

#### [ ] 3.5.6 Phase 3 completion checklist

- [ ] All OAuth flows working
- [ ] All social platforms connected and syncing
- [ ] Unified inbox displaying messages
- [ ] Real-time updates working
- [ ] Filtering and search functional
- [ ] Tests written and passing
- [ ] Update **CURRENT STATUS** section to Phase 4

---

## PHASE 4: PAIN POINT EXTRACTION

**Duration**: Week 5
**Status**: 🔴 Not Started
**Context**: Implement NLP-powered pain point extraction and manual annotation

### Dependencies:

- Phase 3 completed (Social integrations, unified inbox)
- OpenAI API account (or alternative NLP service)
- Inngest configured

### 4.1 NLP Setup

#### [ ] 4.1.1 Setup OpenAI API

- [ ] Create account at https://platform.openai.com
- [ ] Generate API key
- [ ] Add `OPENAI_API_KEY` to `.env.local`
- [ ] Install SDK: `npm install openai`
- [ ] Create `src/lib/openai/client.ts`:

  ```typescript
  import OpenAI from 'openai'

  export const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })
  ```

- [ ] Test connection with simple API call

#### [ ] 4.1.2 Design pain point extraction prompts

- [ ] Create `src/lib/nlp/prompts.ts`:

  ```typescript
  export const PAIN_POINT_EXTRACTION_PROMPT = `
  You are an expert at identifying user pain points and feature requests in social media discussions.
  
  Analyze the following text and extract:
  1. Main pain point or issue described
  2. Sentiment (positive, neutral, negative)
  3. Category (bug, feature request, question, feedback)
  4. Priority (low, medium, high, critical)
  5. Suggested action
  
  Text: {text}
  
  Respond in JSON format:
  {
    "summary": "Brief summary of the pain point",
    "sentiment": "positive|neutral|negative",
    "sentiment_score": 0.0-1.0,
    "category": "bug|feature|question|feedback",
    "priority": "low|medium|high|critical",
    "suggested_action": "What the developer should do",
    "is_pain_point": true|false
  }
  `

  export const SENTIMENT_ANALYSIS_PROMPT = `...`
  ```

- [ ] Test prompts with sample data
- [ ] Iterate on prompt engineering for better accuracy

#### [ ] 4.1.3 Create NLP utility functions

- [ ] Create `src/lib/nlp/extract-pain-points.ts`:

  ```typescript
  export async function extractPainPoint(text: string) {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: PAIN_POINT_EXTRACTION_PROMPT,
        },
        {
          role: 'user',
          content: text,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    })

    return JSON.parse(completion.choices[0].message.content!)
  }
  ```

- [ ] Add error handling and retries
- [ ] Implement rate limiting
- [ ] Add cost tracking/monitoring

#### [ ] 4.1.4 Create sentiment analysis function

- [ ] Create `src/lib/nlp/analyze-sentiment.ts`
- [ ] Implement sentiment scoring (-1.0 to 1.0)
- [ ] Test with various text samples
- [ ] Validate accuracy

### 4.2 Extraction Workflow

#### [ ] 4.2.1 Create Inngest extraction function

- [ ] Create `src/inngest/functions/extract-pain-points.ts`:

  ```typescript
  export const extractPainPoints = inngest.createFunction(
    { id: 'extract-pain-points' },
    { cron: '0 */6 * * *' }, // Every 6 hours
    async ({ event, step }) => {
      // Get unprocessed messages
      const messages = await step.run('get-messages', async () => {
        return getUnprocessedMessages()
      })

      // Process each message
      for (const message of messages) {
        await step.run(`process-${message.id}`, async () => {
          const analysis = await extractPainPoint(message.content)

          if (analysis.is_pain_point) {
            await updatePainPoint(message.id, {
              extracted_summary: analysis.summary,
              sentiment: analysis.sentiment,
              sentiment_score: analysis.sentiment_score,
              category: analysis.category,
              priority: analysis.priority,
              status: 'reviewing',
            })
          }
        })
      }
    }
  )
  ```

- [ ] Add batch processing for efficiency
- [ ] Implement error handling
- [ ] Add progress tracking

#### [ ] 4.2.2 Implement background processing

- [ ] Create database flag for processing status
- [ ] Add `processing_status` field to pain_points table
- [ ] Queue messages for processing
- [ ] Handle processing failures with retries
- [ ] Log processing metrics (time, cost, accuracy)

#### [ ] 4.2.3 Setup Inngest Dev Server

- [ ] Install Inngest CLI: `npm install -g inngest-cli`
- [ ] Create `src/inngest/client.ts`:

  ```typescript
  import { Inngest } from 'inngest'

  export const inngest = new Inngest({
    id: 'devconsul',
    eventKey: process.env.INNGEST_EVENT_KEY,
  })
  ```

- [ ] Create `src/app/api/inngest/route.ts`:

  ```typescript
  import { serve } from 'inngest/next'
  import { inngest } from '@/inngest/client'
  import { extractPainPoints } from '@/inngest/functions/extract-pain-points'

  export const { GET, POST, PUT } = serve({
    client: inngest,
    functions: [extractPainPoints],
  })
  ```

- [ ] Start Inngest dev server: `npx inngest-cli dev`
- [ ] Verify functions registered in Inngest UI

#### [ ] 4.2.4 Implement deduplication

- [ ] Create content hashing function
- [ ] Check for duplicate pain points before creating
- [ ] Merge similar pain points
- [ ] Update existing pain point if duplicate found
- [ ] Add similarity threshold configuration

#### [ ] 4.2.5 Add clustering for similar pain points

- [ ] Implement text similarity comparison
- [ ] Group similar pain points together
- [ ] Display clusters in UI
- [ ] Allow merging of clustered items
- [ ] Track cluster relationships

### 4.3 Manual Annotation Interface

#### [ ] 4.3.1 Create pain points page

- [ ] Create `src/app/dashboard/pain-points/page.tsx`
- [ ] Display list of extracted pain points
- [ ] Show extraction confidence score
- [ ] Add filtering:
  - By status (new, reviewing, approved, rejected)
  - By priority
  - By category
  - By platform
  - By date range
- [ ] Add sorting options
- [ ] Implement pagination/infinite scroll

#### [ ] 4.3.2 Build pain point detail view

- [ ] Create `src/app/dashboard/pain-points/[id]/page.tsx`
- [ ] Display full content with AI-generated summary
- [ ] Show original message source and link
- [ ] Display sentiment analysis results
- [ ] Show suggested category and priority
- [ ] Add edit functionality for all fields

#### [ ] 4.3.3 Create tagging system

- [ ] Install shadcn badge and tags components:
  ```bash
  npx shadcn-ui@latest add badge command
  ```
- [ ] Create `src/components/features/pain-points/tag-input.tsx`
- [ ] Implement tag creation and deletion
- [ ] Store tags in pain_points.tags array
- [ ] Create tag suggestions based on content
- [ ] Add tag filtering in list view

#### [ ] 4.3.4 Build priority assignment UI

- [ ] Create priority selector component:
  - Low (gray)
  - Medium (yellow)
  - High (orange)
  - Critical (red)
- [ ] Allow priority updates
- [ ] Show priority distribution chart
- [ ] Add bulk priority assignment

#### [ ] 4.3.5 Implement status workflow

- [ ] Create status flow: new → reviewing → approved/rejected → resolved
- [ ] Build status selector component
- [ ] Add status change actions:
  - Approve (move to approved, enable GitHub issue creation)
  - Reject (move to rejected, archive)
  - Resolve (mark as resolved, link to solution)
- [ ] Add status history tracking
- [ ] Show status timeline in detail view

#### [ ] 4.3.6 Create notes and context fields

- [ ] Add rich text editor for notes:
  ```bash
  npm install @tiptap/react @tiptap/starter-kit
  ```
- [ ] Allow developers to add context
- [ ] Support markdown formatting
- [ ] Add file attachments (screenshots, logs)
- [ ] Show notes in detail view

#### [ ] 4.3.7 Build bulk actions

- [ ] Multi-select pain points
- [ ] Bulk approve
- [ ] Bulk reject
- [ ] Bulk tag assignment
- [ ] Bulk priority update
- [ ] Bulk export (CSV, JSON)

### 4.4 Analytics & Insights

#### [ ] 4.4.1 Track extraction metrics

- [ ] Create analytics dashboard for pain points:
  - Total extracted
  - Extraction accuracy rate
  - Average confidence score
  - Processing time metrics
  - API cost tracking
- [ ] Add charts and visualizations
- [ ] Export metrics to CSV

#### [ ] 4.4.2 Implement feedback loop

- [ ] Add "Was this extraction accurate?" feedback
- [ ] Track feedback to improve prompts
- [ ] Calculate accuracy over time
- [ ] Use feedback to retrain/adjust prompts

#### [ ] 4.4.3 Create extraction quality reports

- [ ] Generate weekly extraction report
- [ ] Show improvement trends
- [ ] Identify problem areas (low confidence extractions)
- [ ] Suggest prompt improvements

#### [ ] 4.4.4 Phase 4 completion checklist

- [ ] NLP extraction working accurately
- [ ] Inngest jobs processing pain points
- [ ] Manual annotation interface functional
- [ ] Tagging and prioritization working
- [ ] Analytics showing extraction metrics
- [ ] Tests written and passing
- [ ] Update **CURRENT STATUS** section to Phase 5

---

## PHASE 5: GITHUB INTEGRATION

**Duration**: Week 6
**Status**: 🔴 Not Started
**Context**: Build GitHub App, implement webhooks, and automate issue creation

### Dependencies:

- Phase 4 completed (Pain point extraction)
- GitHub account with admin access to test repos
- Understanding of GitHub Apps and webhooks

### 5.1 GitHub App Setup

#### [ ] 5.1.1 Create GitHub App

- [ ] Go to GitHub Settings → Developer settings → GitHub Apps
- [ ] Click "New GitHub App"
- [ ] Configure app:
  - Name: "DevConsul"
  - Homepage URL: `https://devconsul.com`
  - Callback URL: `https://app.devconsul.com/api/github/callback`
  - Webhook URL: `https://app.devconsul.com/api/github/webhook`
  - Webhook secret: Generate with `openssl rand -hex 32`
- [ ] Set permissions:
  - Issues: Read & write
  - Pull requests: Read & write (for future features)
  - Contents: Read-only
  - Metadata: Read-only
- [ ] Subscribe to events:
  - Issues
  - Issue comments
  - Pull requests
  - Push
- [ ] Where can this app be installed: "Any account"
- [ ] Create app and download private key (.pem file)

#### [ ] 5.1.2 Store GitHub App credentials

- [ ] Add to `.env.local`:
  ```bash
  GITHUB_APP_ID=your_app_id
  GITHUB_CLIENT_ID=your_client_id
  GITHUB_CLIENT_SECRET=your_client_secret
  GITHUB_WEBHOOK_SECRET=generated_secret
  GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
  ```
- [ ] Update `.env.example` with placeholder values
- [ ] Add to Vercel environment variables
- [ ] Secure private key storage (environment variable, not file)

#### [ ] 5.1.3 Install GitHub SDK

- [ ] Install Octokit: `npm install @octokit/app @octokit/auth-app @octokit/rest`
- [ ] Create `src/lib/github/app.ts`:

  ```typescript
  import { App } from '@octokit/app'

  export const githubApp = new App({
    appId: process.env.GITHUB_APP_ID!,
    privateKey: process.env.GITHUB_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    oauth: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    webhooks: {
      secret: process.env.GITHUB_WEBHOOK_SECRET!,
    },
  })
  ```

- [ ] Create `src/lib/github/client.ts`:
  ```typescript
  export async function getInstallationOctokit(installationId: number) {
    return await githubApp.getInstallationOctokit(installationId)
  }
  ```
- [ ] Test authentication

### 5.2 GitHub App Installation Flow

#### [ ] 5.2.1 Create installation UI

- [ ] Create `src/app/dashboard/github/page.tsx`
- [ ] Add "Install GitHub App" button
- [ ] Show installation instructions
- [ ] Display list of connected repositories
- [ ] Show installation status

#### [ ] 5.2.2 Implement OAuth flow

- [ ] Create `src/app/api/github/install/route.ts`:
  ```typescript
  export async function GET() {
    const installationUrl = `https://github.com/apps/devconsul/installations/new`
    redirect(installationUrl)
  }
  ```
- [ ] Create `src/app/api/github/callback/route.ts`:

  ```typescript
  export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const installationId = searchParams.get('installation_id')

    // Exchange code for access token
    const { data } = await githubApp.oauth.createToken({ code })

    // Store installation
    await storeGitHubInstallation({
      userId: session.user.id,
      installationId,
      accessToken: data.token,
    })

    redirect('/dashboard/github')
  }
  ```

- [ ] Handle installation completion
- [ ] Store installation details in database

#### [ ] 5.2.3 Fetch and display repositories

- [ ] Create `src/lib/github/repos.ts`:
  ```typescript
  export async function getInstallationRepos(installationId: number) {
    const octokit = await getInstallationOctokit(installationId)
    const { data } = await octokit.rest.apps.listReposAccessibleToInstallation()
    return data.repositories
  }
  ```
- [ ] Display repos in UI
- [ ] Allow selecting which repos to track
- [ ] Store selected repos in `github_repos` table
- [ ] Generate unique webhook secret for each repo

#### [ ] 5.2.4 Build repo management UI

- [ ] Show connected repos with status
- [ ] Add "Disconnect" functionality
- [ ] Show webhook status (active/inactive)
- [ ] Add webhook testing functionality
- [ ] Display recent webhook events

### 5.3 Webhook Implementation

#### [ ] 5.3.1 Create webhook endpoint

- [ ] Create `src/app/api/github/webhook/route.ts`:

  ```typescript
  import { Webhooks } from '@octokit/webhooks'

  const webhooks = new Webhooks({
    secret: process.env.GITHUB_WEBHOOK_SECRET!,
  })

  export async function POST(request: Request) {
    const body = await request.text()
    const signature = request.headers.get('x-hub-signature-256')!
    const event = request.headers.get('x-github-event')!

    // Verify signature
    const verified = await webhooks.verify(body, signature)
    if (!verified) {
      return new Response('Invalid signature', { status: 401 })
    }

    // Process event
    await processWebhookEvent(event, JSON.parse(body))

    return new Response('OK', { status: 200 })
  }
  ```

- [ ] Implement signature verification
- [ ] Add request logging
- [ ] Handle rate limiting

#### [ ] 5.3.2 Process webhook events

- [ ] Create `src/lib/github/webhook-handlers.ts`:

  ```typescript
  export async function processWebhookEvent(event: string, payload: any) {
    switch (event) {
      case 'issues':
        return handleIssuesEvent(payload)
      case 'issue_comment':
        return handleIssueCommentEvent(payload)
      case 'pull_request':
        return handlePullRequestEvent(payload)
      case 'push':
        return handlePushEvent(payload)
      default:
        console.log(`Unhandled event: ${event}`)
    }
  }

  async function handleIssuesEvent(payload: any) {
    const { action, issue, repository } = payload

    if (action === 'opened') {
      // Store new issue
    } else if (action === 'closed') {
      // Update issue status
      await updateGitHubIssueStatus(issue.number, 'closed')
    }
  }
  ```

- [ ] Handle `issues.opened` event
- [ ] Handle `issues.closed` event
- [ ] Handle `issue_comment.created` event
- [ ] Handle `push` event for devlog

#### [ ] 5.3.3 Store webhook events

- [ ] Create `webhook_events` table:
  ```sql
  CREATE TABLE public.webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  ```
- [ ] Save all webhook events for debugging
- [ ] Add event replay functionality
- [ ] Implement event processing queue
- [ ] Handle failed events with retry logic

#### [ ] 5.3.4 Test webhooks locally

- [ ] Use ngrok for local webhook testing:
  ```bash
  npx ngrok http 3000
  ```
- [ ] Update GitHub App webhook URL to ngrok URL
- [ ] Trigger test events (create/close issues)
- [ ] Verify events received and processed
- [ ] Check database for stored events

### 5.4 Issue Automation

#### [ ] 5.4.1 Create issue from pain point

- [ ] Create `src/lib/github/create-issue.ts`:

  ```typescript
  export async function createIssueFromPainPoint(
    painPointId: string,
    repoId: string
  ) {
    const painPoint = await getPainPoint(painPointId)
    const repo = await getGitHubRepo(repoId)

    const octokit = await getInstallationOctokit(repo.installation_id)

    const { data: issue } = await octokit.rest.issues.create({
      owner: repo.owner,
      repo: repo.name,
      title: painPoint.extracted_summary || painPoint.content.slice(0, 100),
      body: formatIssueBody(painPoint),
      labels: [painPoint.category, `priority:${painPoint.priority}`],
    })

    // Link issue to pain point
    await createGitHubIssueLink({
      painPointId,
      repoId,
      issueNumber: issue.number,
      issueUrl: issue.html_url,
    })

    return issue
  }

  function formatIssueBody(painPoint: any) {
    return `
  ## Pain Point Details
  
  **Source**: ${painPoint.source_platform}
  **Link**: ${painPoint.source_url}
  **Priority**: ${painPoint.priority}
  **Sentiment**: ${painPoint.sentiment}
  
  ## Description
  
  ${painPoint.content}
  
  ## AI Summary
  
  ${painPoint.extracted_summary}
  
  ---
  
  _This issue was automatically created by DevConsul from user feedback._
    `.trim()
  }
  ```

- [ ] Add error handling
- [ ] Handle API rate limits
- [ ] Support custom issue templates

#### [ ] 5.4.2 Build issue creation UI

- [ ] Add "Create GitHub Issue" button to pain point detail
- [ ] Show repo selector dropdown
- [ ] Preview issue before creating
- [ ] Show creation success/error
- [ ] Display created issue link
- [ ] Update pain point status to "in_progress" when issue created

#### [ ] 5.4.3 Sync issue status

- [ ] Create Inngest function to sync issue status:

  ```typescript
  export const syncGitHubIssues = inngest.createFunction(
    { id: 'sync-github-issues' },
    { cron: '0 * * * *' }, // Every hour
    async ({ event, step }) => {
      const repos = await step.run('get-repos', () => getActiveRepos())

      for (const repo of repos) {
        await step.run(`sync-${repo.id}`, async () => {
          const octokit = await getInstallationOctokit(repo.installation_id)
          const { data: issues } = await octokit.rest.issues.listForRepo({
            owner: repo.owner,
            repo: repo.name,
            state: 'all',
          })

          for (const issue of issues) {
            await updateGitHubIssueStatus(issue.number, issue.state)
          }
        })
      }
    }
  )
  ```

- [ ] Update pain point status when issue closes
- [ ] Track issue resolution time
- [ ] Add issue comments to pain point timeline

#### [ ] 5.4.4 Implement bidirectional linking

- [ ] Display GitHub issue info in pain point detail
- [ ] Show pain point reference in GitHub issue
- [ ] Link issue comments back to pain point
- [ ] Update both sides when status changes
- [ ] Handle issue deletion/closure

#### [ ] 5.4.5 Build GitHub activity feed

- [ ] Create `src/app/dashboard/github/activity/page.tsx`
- [ ] Display recent GitHub events:
  - Issues opened
  - Issues closed
  - PRs merged
  - Commits pushed
- [ ] Add filtering by repo and event type
- [ ] Show event timeline
- [ ] Link events to related pain points

### 5.5 Advanced GitHub Features

#### [ ] 5.5.1 Issue labels management

- [ ] Sync labels from GitHub repos
- [ ] Create custom DevConsul labels in repos:
  - `devconsul` (auto-added to all issues)
  - `pain-point` (sourced from user feedback)
  - `priority:low`, `priority:medium`, `priority:high`, `priority:critical`
- [ ] Auto-apply labels based on pain point data
- [ ] Allow editing labels from DevConsul UI

#### [ ] 5.5.2 Issue templates integration

- [ ] Detect existing issue templates in repos
- [ ] Use templates when creating issues
- [ ] Support custom template mapping
- [ ] Preview template before creating issue

#### [ ] 5.5.3 Milestone tracking

- [ ] Fetch GitHub milestones
- [ ] Assign issues to milestones
- [ ] Track milestone progress in dashboard
- [ ] Link pain points to milestones

#### [ ] 5.5.4 Phase 5 completion checklist

- [ ] GitHub App created and configured
- [ ] Installation flow working
- [ ] Webhooks receiving events
- [ ] Issues created from pain points
- [ ] Bidirectional linking functional
- [ ] Status sync working
- [ ] Tests written and passing
- [ ] Update **CURRENT STATUS** section to Phase 6

---

## PHASE 6: DEVLOG AUTOMATION

**Duration**: Week 7
**Status**: 🔴 Not Started
**Context**: Automate daily devlog tweets based on GitHub activity

### Dependencies:

- Phase 5 completed (GitHub integration)
- Twitter API elevated access approved
- Inngest configured

### 6.1 Devlog Content Generation

#### [ ] 6.1.1 Create devlog generation logic

- [ ] Create `src/lib/devlog/generator.ts`:

  ```typescript
  export async function generateDevlogContent(
    userId: string,
    date: Date
  ): Promise<string> {
    // Fetch GitHub activity for the day
    const activity = await getGitHubActivityForDay(userId, date)

    // Format: "Today's progress: ✅ Closed #123 (User auth bug), 🚀 Merged #124 (Dark mode), 📝 3 commits to main"
    const tweets = []

    if (activity.issuesClosed.length > 0) {
      tweets.push(`✅ Closed: ${formatIssues(activity.issuesClosed)}`)
    }

    if (activity.prsMerged.length > 0) {
      tweets.push(`🚀 Merged: ${formatPRs(activity.prsMerged)}`)
    }

    if (activity.commits.length > 0) {
      tweets.push(`📝 ${activity.commits.length} commits`)
    }

    if (activity.issuesOpened.length > 0) {
      tweets.push(`🔍 Investigating: ${formatIssues(activity.issuesOpened)}`)
    }

    const content = `Day ${getDayNumber()} update:\n\n${tweets.join('\n')}\n\n#buildinpublic #dev`

    return content
  }

  function formatIssues(issues: any[]) {
    return issues
      .slice(0, 3)
      .map((i) => `#${i.number} (${i.title.slice(0, 30)}...)`)
      .join(', ')
  }
  ```

- [ ] Handle days with no activity (skip or motivational message)
- [ ] Support custom devlog templates
- [ ] Add emoji variations for different event types

#### [ ] 6.1.2 Create activity aggregation

- [ ] Create `src/lib/devlog/activity.ts`:

  ```typescript
  export async function getGitHubActivityForDay(userId: string, date: Date) {
    const startOfDay = new Date(date.setHours(0, 0, 0, 0))
    const endOfDay = new Date(date.setHours(23, 59, 59, 999))

    const repos = await getUserGitHubRepos(userId)

    const activity = {
      issuesClosed: [],
      issuesOpened: [],
      prsMerged: [],
      prsOpened: [],
      commits: [],
    }

    for (const repo of repos) {
      const octokit = await getInstallationOctokit(repo.installation_id)

      // Fetch issues closed today
      const { data: issues } = await octokit.rest.issues.listForRepo({
        owner: repo.owner,
        repo: repo.name,
        state: 'closed',
        since: startOfDay.toISOString(),
      })

      activity.issuesClosed.push(
        ...issues.filter(
          (i) =>
            new Date(i.closed_at!) >= startOfDay &&
            new Date(i.closed_at!) <= endOfDay
        )
      )

      // Similar for PRs, commits, etc.
    }

    return activity
  }
  ```

- [ ] Cache activity data for reuse
- [ ] Handle multiple repos efficiently
- [ ] Add filtering options (exclude certain repos, events)

#### [ ] 6.1.3 Implement character limit optimization

- [ ] Ensure tweets stay under 280 characters
- [ ] Truncate long issue titles intelligently
- [ ] Abbreviate common terms (Issue → Iss, Feature → Feat)
- [ ] Use thread if content exceeds limit:

  ```typescript
  function splitIntoThreads(content: string): string[] {
    const maxLength = 280
    const threads = []

    // Split logic

    return threads
  }
  ```

- [ ] Add thread numbering (1/3, 2/3, 3/3)

#### [ ] 6.1.4 Add devlog templates

- [ ] Create template system:
  ```typescript
  export const DEVLOG_TEMPLATES = {
    progress: 'Day {day}: {activity}',
    milestone: '🎉 Milestone achieved: {milestone}',
    feature: '✨ New feature: {feature}',
    bugfix: '🐛 Fixed: {bug}',
    release: '🚀 Released v{version}: {changes}',
  }
  ```
- [ ] Allow users to customize templates
- [ ] Store templates in user settings
- [ ] Preview template before posting

### 6.2 Twitter Posting Integration

#### [ ] 6.2.1 Create Twitter posting function

- [ ] Create `src/lib/twitter/post.ts`:

  ```typescript
  import { TwitterClient } from './client'

  export async function postTweet(userId: string, content: string) {
    const connection = await getTwitterConnection(userId)
    const client = new TwitterClient(connection.access_token)

    const tweet = await client.postTweet(content)

    // Store devlog post record
    await createDevlogPost({
      userId,
      content,
      platformPostId: tweet.id,
      status: 'published',
      publishedAt: new Date(),
    })

    return tweet
  }
  ```

- [ ] Handle Twitter API errors (rate limits, auth issues)
- [ ] Add retry logic with exponential backoff
- [ ] Support tweet threads

#### [ ] 6.2.2 Implement tweet threading

- [ ] Create `src/lib/twitter/thread.ts`:

  ```typescript
  export async function postThread(userId: string, tweets: string[]) {
    const connection = await getTwitterConnection(userId)
    const client = new TwitterClient(connection.access_token)

    let previousTweetId: string | undefined

    for (const [index, content] of tweets.entries()) {
      const tweet = await client.postTweet(content, {
        reply_to_tweet_id: previousTweetId,
      })
      previousTweetId = tweet.id

      // Wait to avoid rate limits
      if (index < tweets.length - 1) {
        await sleep(1000)
      }
    }
  }
  ```

- [ ] Handle threading errors
- [ ] Save thread relationships in database

#### [ ] 6.2.3 Add media attachments

- [ ] Support image attachments:

  ```typescript
  export async function postTweetWithMedia(
    userId: string,
    content: string,
    mediaUrls: string[]
  ) {
    const client = new TwitterClient(accessToken)

    // Upload media
    const mediaIds = []
    for (const url of mediaUrls) {
      const mediaId = await client.uploadMedia(url)
      mediaIds.push(mediaId)
    }

    // Post tweet with media
    const tweet = await client.postTweet(content, {
      media_ids: mediaIds,
    })

    return tweet
  }
  ```

- [ ] Support screenshots (auto-generate from GitHub issue)
- [ ] Support GIFs and videos
- [ ] Optimize image sizes for Twitter

### 6.3 Scheduling & Automation

#### [ ] 6.3.1 Create daily devlog job

- [ ] Create `src/inngest/functions/daily-devlog.ts`:

  ```typescript
  export const dailyDevlog = inngest.createFunction(
    { id: 'daily-devlog' },
    { cron: '0 18 * * *' }, // Daily at 6 PM
    async ({ event, step }) => {
      const users = await step.run('get-users', async () => {
        return getUsersWithDevlogEnabled()
      })

      for (const user of users) {
        await step.run(`devlog-${user.id}`, async () => {
          // Generate content
          const content = await generateDevlogContent(user.id, new Date())

          // Skip if no activity
          if (!content || content.length === 0) {
            return
          }

          // Post tweet
          await postTweet(user.id, content)
        })
      }
    }
  )
  ```

- [ ] Add user preferences for devlog time
- [ ] Support different timezones
- [ ] Add opt-out functionality

#### [ ] 6.3.2 Implement scheduling UI

- [ ] Create `src/app/dashboard/devlog/page.tsx`
- [ ] Show scheduled devlog posts
- [ ] Display posting schedule (daily, time)
- [ ] Show preview of next devlog content
- [ ] Add "Post Now" button for manual posting
- [ ] Show posting history

#### [ ] 6.3.3 Build devlog preview

- [ ] Create preview component:
  ```tsx
  export function DevlogPreview({ content }: { content: string }) {
    return (
      <div className="twitter-preview">
        <div className="tweet-header">
          <Avatar />
          <span>@username</span>
        </div>
        <div className="tweet-content">{content}</div>
        <div className="tweet-footer">
          <span>Just now</span>
        </div>
      </div>
    )
  }
  ```
- [ ] Style to look like real tweet
- [ ] Show character count
- [ ] Allow editing before posting

#### [ ] 6.3.4 Add manual posting

- [ ] Create "New Devlog" page
- [ ] Allow manual content creation
- [ ] Support markdown in editor
- [ ] Convert markdown to tweet format
- [ ] Add media upload
- [ ] Schedule for specific time
- [ ] Save as draft

### 6.4 Devlog Management

#### [ ] 6.4.1 Build devlog history page

- [ ] Create `src/app/dashboard/devlog/history/page.tsx`
- [ ] Display all posted devlogs
- [ ] Show engagement metrics (likes, retweets, replies)
- [ ] Link to Twitter post
- [ ] Show related GitHub activity
- [ ] Add filtering by date range

#### [ ] 6.4.2 Implement devlog analytics

- [ ] Fetch tweet metrics from Twitter API:

  ```typescript
  export async function getTweetMetrics(tweetId: string) {
    const tweet = await client.getTweet(tweetId, {
      'tweet.fields': ['public_metrics'],
    })

    return {
      likes: tweet.public_metrics.like_count,
      retweets: tweet.public_metrics.retweet_count,
      replies: tweet.public_metrics.reply_count,
      impressions: tweet.public_metrics.impression_count,
    }
  }
  ```

- [ ] Store metrics in database
- [ ] Update metrics periodically (every 6 hours)
- [ ] Show trends over time

#### [ ] 6.4.3 Create devlog settings

- [ ] Create `src/app/dashboard/devlog/settings/page.tsx`
- [ ] Add settings:
  - Enable/disable auto-posting
  - Posting time (with timezone)
  - Devlog template selection
  - Include/exclude specific repos
  - Custom hashtags
  - Minimum activity threshold (skip if < N events)
- [ ] Save settings to user profile
- [ ] Apply settings to devlog generation

#### [ ] 6.4.4 Build devlog draft system

- [ ] Save generated content as draft before posting
- [ ] Allow editing drafts
- [ ] Schedule drafts for later
- [ ] Delete unwanted drafts
- [ ] Show draft queue

#### [ ] 6.4.5 Add devlog notifications

- [ ] Notify user before posting (email/in-app)
- [ ] Send confirmation after posting
- [ ] Alert on posting failures
- [ ] Show posting status in dashboard

### 6.5 Error Handling & Monitoring

#### [ ] 6.5.1 Handle Twitter API errors

- [ ] Catch and log all Twitter API errors
- [ ] Handle rate limit errors (429):
  - Wait for rate limit reset
  - Retry after wait
  - Queue posts if limit reached
- [ ] Handle authentication errors (401):
  - Mark connection as expired
  - Notify user to reconnect
- [ ] Handle content policy violations (403)

#### [ ] 6.5.2 Implement retry logic

- [ ] Retry failed posts up to 3 times
- [ ] Use exponential backoff (1s, 5s, 15s)
- [ ] Save failed posts for manual retry
- [ ] Alert user of permanent failures

#### [ ] 6.5.3 Add monitoring and alerts

- [ ] Track devlog posting success rate
- [ ] Alert on consecutive failures (>3)
- [ ] Monitor Twitter API quota usage
- [ ] Track posting latency
- [ ] Log all posting attempts

#### [ ] 6.5.4 Phase 6 completion checklist

- [ ] Devlog content generation working
- [ ] Twitter posting functional
- [ ] Daily automation running
- [ ] Preview and manual posting available
- [ ] Analytics tracking engagement
- [ ] Error handling robust
- [ ] Tests written and passing
- [ ] Update **CURRENT STATUS** section to Phase 7

---

## PHASE 7: ANALYTICS DASHBOARD

**Duration**: Week 8
**Status**: 🔴 Not Started
**Context**: Build comprehensive analytics for pain points, GitHub activity, and social engagement

### Dependencies:

- All previous phases completed
- Data being collected from all integrations
- Chart library installed (recharts or similar)

### 7.1 Analytics Infrastructure

#### [ ] 7.1.1 Install chart libraries

- [ ] Install Recharts: `npm install recharts`
- [ ] Install date utilities: `npm install date-fns`
- [ ] Install chart components from shadcn:
  ```bash
  npx shadcn-ui@latest add chart
  ```
- [ ] Create chart wrapper components

#### [ ] 7.1.2 Create analytics data models

- [ ] Create `src/lib/analytics/queries.ts`:

  ```typescript
  export async function getPainPointsMetrics(
    userId: string,
    dateRange: { from: Date; to: Date }
  ) {
    const supabase = await createClient()

    const { data } = await supabase
      .from('pain_points')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', dateRange.from.toISOString())
      .lte('created_at', dateRange.to.toISOString())

    return {
      total: data?.length || 0,
      byPlatform: groupBy(data, 'source_platform'),
      byStatus: groupBy(data, 'status'),
      byPriority: groupBy(data, 'priority'),
      bySentiment: groupBy(data, 'sentiment'),
      overTime: groupByDate(data, 'created_at'),
    }
  }

  export async function getGitHubMetrics(userId: string, dateRange: any) {
    // Similar for GitHub data
  }

  export async function getDevlogMetrics(userId: string, dateRange: any) {
    // Similar for devlog data
  }
  ```

- [ ] Add caching for expensive queries
- [ ] Optimize with database views/materialized views

#### [ ] 7.1.3 Setup analytics database views

- [ ] Create database views for common queries:
  ```sql
  CREATE VIEW pain_points_daily_summary AS
  SELECT
    user_id,
    DATE(created_at) as date,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE status = 'resolved') as resolved,
    COUNT(*) FILTER (WHERE priority = 'critical') as critical,
    AVG(sentiment_score) as avg_sentiment
  FROM pain_points
  GROUP BY user_id, DATE(created_at);
  ```
- [ ] Create view for GitHub metrics
- [ ] Create view for devlog metrics
- [ ] Add indexes for performance

#### [ ] 7.1.4 Implement data aggregation jobs

- [ ] Create Inngest function for daily aggregation:

  ```typescript
  export const aggregateDailyMetrics = inngest.createFunction(
    { id: 'aggregate-daily-metrics' },
    { cron: '0 1 * * *' }, // Daily at 1 AM
    async ({ event, step }) => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      await step.run('aggregate-pain-points', async () => {
        await aggregatePainPointsForDate(yesterday)
      })

      await step.run('aggregate-github', async () => {
        await aggregateGitHubForDate(yesterday)
      })

      await step.run('aggregate-devlog', async () => {
        await aggregateDevlogForDate(yesterday)
      })
    }
  )
  ```

- [ ] Store aggregated data in analytics_events table
- [ ] Improve query performance with pre-computed metrics

### 7.2 Dashboard Visualizations

#### [ ] 7.2.1 Create analytics dashboard page

- [ ] Create `src/app/dashboard/analytics/page.tsx`
- [ ] Add date range picker component:
  ```bash
  npx shadcn-ui@latest add calendar popover
  ```
- [ ] Create date range selector (Last 7 days, 30 days, 90 days, All time, Custom)
- [ ] Add export functionality (CSV, PDF)

#### [ ] 7.2.2 Build pain points analytics

- [ ] Create `src/components/analytics/pain-points-charts.tsx`:
  - Total pain points card (with trend)
  - Pain points by platform (pie chart)
  - Pain points by status (bar chart)
  - Pain points by priority (stacked bar)
  - Pain points over time (line chart)
  - Sentiment distribution (area chart)
  - Average resolution time (metric card)
- [ ] Add insights/commentary for each chart
- [ ] Show top pain points by priority

#### [ ] 7.2.3 Build GitHub analytics

- [ ] Create `src/components/analytics/github-charts.tsx`:
  - Total issues created (metric card)
  - Issues opened vs closed (line chart)
  - Pull requests merged (bar chart)
  - Commits by day (heat map)
  - Average issue close time (metric card)
  - Top repositories by activity (list)
  - Issue resolution rate (percentage)
- [ ] Link to GitHub for more details
- [ ] Show active milestones progress

#### [ ] 7.2.4 Build devlog analytics

- [ ] Create `src/components/analytics/devlog-charts.tsx`:
  - Total devlog posts (metric card)
  - Engagement rate over time (line chart)
  - Likes, retweets, replies breakdown (bar chart)
  - Best performing posts (list)
  - Posting frequency (calendar heatmap)
  - Reach and impressions (trend chart)
- [ ] Show engagement insights
- [ ] Highlight viral posts

#### [ ] 7.2.5 Create unified metrics overview

- [ ] Create `src/app/dashboard/page.tsx` (update homepage):
  - Total pain points extracted
  - Active social connections
  - GitHub issues created/resolved
  - Devlog posts published
  - Total engagement (likes + retweets + replies)
  - Week-over-week growth indicators
- [ ] Add "Recent Activity" feed
- [ ] Add "Quick Actions" shortcuts

### 7.3 Advanced Analytics Features

#### [ ] 7.3.1 Implement sentiment tracking

- [ ] Create sentiment trend chart
- [ ] Track sentiment by platform
- [ ] Alert on negative sentiment spikes
- [ ] Show sentiment word cloud (top keywords)
- [ ] Track sentiment changes over time

#### [ ] 7.3.2 Build response time analytics

- [ ] Calculate average response time:
  - Pain point extraction → GitHub issue creation
  - Issue creation → first commit
  - First commit → issue closure
- [ ] Show response time trends
- [ ] Highlight fast and slow response times
- [ ] Compare to industry benchmarks

#### [ ] 7.3.3 Create engagement funnel

- [ ] Build funnel visualization:
  - Social mentions detected
  - Pain points extracted
  - Pain points approved
  - GitHub issues created
  - Issues resolved
  - Devlog posts published
- [ ] Calculate conversion rates at each stage
- [ ] Identify bottlenecks
- [ ] Suggest improvements

#### [ ] 7.3.4 Add comparison views

- [ ] Compare metrics across time periods
- [ ] Compare platforms (Reddit vs LinkedIn vs Twitter)
- [ ] Compare repositories
- [ ] Show growth trends
- [ ] Identify patterns

#### [ ] 7.3.5 Build custom reports

- [ ] Create report builder UI
- [ ] Allow selecting metrics and charts
- [ ] Support custom date ranges
- [ ] Save custom reports
- [ ] Schedule automated report delivery (email)
- [ ] Export reports (PDF, CSV, JSON)

### 7.4 Real-time Analytics

#### [ ] 7.4.1 Implement live metrics

- [ ] Show real-time pain points extracted (today)
- [ ] Show real-time GitHub activity (today)
- [ ] Show live devlog engagement updates
- [ ] Use Supabase real-time subscriptions
- [ ] Add auto-refresh (every 30 seconds)

#### [ ] 7.4.2 Create activity stream

- [ ] Build real-time activity feed:

  ```tsx
  export function ActivityStream() {
    const { data: activities } = useRealtimeActivities()

    return (
      <div className="activity-stream">
        {activities.map((activity) => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </div>
    )
  }
  ```

- [ ] Show all recent events (pain points, issues, devlogs)
- [ ] Add timestamps (e.g., "2 minutes ago")
- [ ] Link to source items
- [ ] Auto-scroll to new items

#### [ ] 7.4.3 Add live notifications

- [ ] Notify on new pain point extracted
- [ ] Notify on GitHub issue created/closed
- [ ] Notify on devlog posted
- [ ] Notify on high engagement
- [ ] Use toast notifications (shadcn/ui toast)

### 7.5 Performance Optimization

#### [ ] 7.5.1 Optimize query performance

- [ ] Add database indexes for analytics queries
- [ ] Use database views for complex queries
- [ ] Implement query result caching (Redis or in-memory)
- [ ] Add pagination for large datasets
- [ ] Use SQL optimization techniques

#### [ ] 7.5.2 Implement data caching

- [ ] Cache analytics data with React Query:
  ```typescript
  export function usePainPointsMetrics(dateRange: DateRange) {
    return useQuery({
      queryKey: ['pain-points-metrics', dateRange],
      queryFn: () => getPainPointsMetrics(userId, dateRange),
      staleTime: 5 * 60 * 1000, // 5 minutes
    })
  }
  ```
- [ ] Invalidate cache on data changes
- [ ] Use background refetching
- [ ] Implement cache warming

#### [ ] 7.5.3 Optimize chart rendering

- [ ] Lazy load charts (use dynamic imports)
- [ ] Debounce chart updates
- [ ] Use virtualization for large datasets
- [ ] Optimize chart data structures
- [ ] Reduce re-renders with memoization

#### [ ] 7.5.4 Phase 7 completion checklist

- [ ] Analytics dashboard built and functional
- [ ] All key metrics displayed
- [ ] Charts rendering correctly
- [ ] Real-time updates working
- [ ] Performance optimized
- [ ] Export functionality working
- [ ] Tests written and passing
- [ ] Update **CURRENT STATUS** section to Phase 8

---

## PHASE 8: TESTING & QUALITY ASSURANCE

**Duration**: Week 9
**Status**: 🔴 Not Started
**Context**: Comprehensive testing and security hardening

### Dependencies:

- All features implemented (Phases 1-7)
- Testing infrastructure setup (Vitest, Playwright)
- Sentry configured

### 8.1 Unit Testing

#### [ ] 8.1.1 Write authentication tests

- [ ] Test `src/lib/auth/server.ts`:
  - `getSession()` with valid/invalid session
  - `getUser()` with authenticated/unauthenticated
- [ ] Test signup flow
- [ ] Test login flow
- [ ] Test password reset
- [ ] Test session management
- [ ] Achieve >80% coverage

#### [ ] 8.1.2 Write database utility tests

- [ ] Test `src/lib/db/profiles.ts`:
  - `getProfile()` success and error cases
  - `updateProfile()` with valid/invalid data
- [ ] Test all database utilities:
  - Social connections CRUD
  - Pain points CRUD
  - GitHub repos CRUD
- [ ] Test RLS policies enforcement
- [ ] Mock Supabase client for tests

#### [ ] 8.1.3 Write NLP extraction tests

- [ ] Test `extractPainPoint()`:

  ```typescript
  describe('extractPainPoint', () => {
    it('should extract pain point from user complaint', async () => {
      const text = "The login page is broken, I can't sign in!"
      const result = await extractPainPoint(text)

      expect(result.is_pain_point).toBe(true)
      expect(result.sentiment).toBe('negative')
      expect(result.category).toBe('bug')
      expect(result.priority).toMatch(/high|critical/)
    })

    it('should handle non-pain-point text', async () => {
      const text = 'I love this product!'
      const result = await extractPainPoint(text)

      expect(result.is_pain_point).toBe(false)
      expect(result.sentiment).toBe('positive')
    })
  })
  ```

- [ ] Test sentiment analysis accuracy
- [ ] Test edge cases (empty text, very long text)
- [ ] Mock OpenAI API calls

#### [ ] 8.1.4 Write GitHub integration tests

- [ ] Test `createIssueFromPainPoint()`:
  - Successful issue creation
  - Handle API errors
  - Format issue body correctly
- [ ] Test webhook signature verification
- [ ] Test webhook event processing
- [ ] Mock GitHub API (use nock or msw)

#### [ ] 8.1.5 Write devlog generation tests

- [ ] Test `generateDevlogContent()`:
  - With various GitHub activities
  - With no activity
  - Character limit handling
  - Template formatting
- [ ] Test tweet threading logic
- [ ] Test media attachment handling

#### [ ] 8.1.6 Write analytics tests

- [ ] Test metrics calculation functions
- [ ] Test data aggregation logic
- [ ] Test date range filtering
- [ ] Validate chart data structures

### 8.2 Integration Testing

#### [ ] 8.2.1 Test authentication flows

- [ ] Test complete signup → email confirmation → login flow
- [ ] Test password reset flow end-to-end
- [ ] Test protected route access
- [ ] Test session expiry handling
- [ ] Test concurrent login sessions

#### [ ] 8.2.2 Test social OAuth flows

- [ ] Test Reddit OAuth:
  - Connection flow
  - Token refresh
  - Data fetching
  - Disconnection
- [ ] Test LinkedIn OAuth (same checks)
- [ ] Test Twitter OAuth (same checks)
- [ ] Test OAuth error scenarios

#### [ ] 8.2.3 Test GitHub integration flow

- [ ] Test GitHub App installation
- [ ] Test repository selection
- [ ] Test webhook event handling
- [ ] Test issue creation from pain point
- [ ] Test issue status sync
- [ ] Test disconnection

#### [ ] 8.2.4 Test pain point workflow

- [ ] Test: Social post → Inbox → Pain point extraction → Manual review → GitHub issue → Devlog
- [ ] Test approval workflow
- [ ] Test rejection workflow
- [ ] Test bulk operations
- [ ] Test real-time updates

#### [ ] 8.2.5 Test devlog automation

- [ ] Test daily devlog generation
- [ ] Test manual devlog posting
- [ ] Test scheduled posting
- [ ] Test thread creation
- [ ] Test engagement tracking

### 8.3 End-to-End Testing (Playwright)

#### [ ] 8.3.1 Create E2E test suite structure

- [ ] Create `tests/e2e/` directory
- [ ] Setup test fixtures and helpers
- [ ] Configure test users and data
- [ ] Create page object models:

  ```typescript
  // tests/e2e/pages/login.page.ts
  export class LoginPage {
    constructor(private page: Page) {}

    async goto() {
      await this.page.goto('/login')
    }

    async login(email: string, password: string) {
      await this.page.fill('[name="email"]', email)
      await this.page.fill('[name="password"]', password)
      await this.page.click('button[type="submit"]')
    }
  }
  ```

#### [ ] 8.3.2 Write critical user journey tests

- [ ] Test new user onboarding:

  ```typescript
  test('new user can complete onboarding', async ({ page }) => {
    await page.goto('/signup')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'SecurePass123!')
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('h1')).toContainText('Welcome')
  })
  ```

- [ ] Test connecting social accounts
- [ ] Test installing GitHub App
- [ ] Test creating issue from pain point
- [ ] Test posting devlog

#### [ ] 8.3.3 Test responsive design

- [ ] Test on mobile viewport (375px):

  ```typescript
  test.use({ viewport: { width: 375, height: 667 } })

  test('mobile navigation works', async ({ page }) => {
    await page.goto('/dashboard')
    await page.click('[data-testid="mobile-menu-button"]')
    await expect(page.locator('nav')).toBeVisible()
  })
  ```

- [ ] Test on tablet (768px)
- [ ] Test on desktop (1920px)
- [ ] Verify all interactions work on touch

#### [ ] 8.3.4 Test accessibility

- [ ] Run axe accessibility tests:

  ```typescript
  import { injectAxe, checkA11y } from 'axe-playwright'

  test('homepage is accessible', async ({ page }) => {
    await page.goto('/')
    await injectAxe(page)
    await checkA11y(page)
  })
  ```

- [ ] Test keyboard navigation
- [ ] Test screen reader compatibility
- [ ] Verify WCAG 2.1 AA compliance
- [ ] Test color contrast ratios

#### [ ] 8.3.5 Test error scenarios

- [ ] Test network failures (offline mode)
- [ ] Test API errors (500, 404)
- [ ] Test invalid form submissions
- [ ] Test session expiry during operations
- [ ] Test concurrent user actions

### 8.4 Security Testing

#### [ ] 8.4.1 Authentication security audit

- [ ] Test password strength requirements
- [ ] Test SQL injection prevention in auth
- [ ] Test XSS prevention in forms
- [ ] Verify secure session management
- [ ] Test CSRF protection
- [ ] Verify secure cookie settings (httpOnly, secure, sameSite)

#### [ ] 8.4.2 Authorization testing

- [ ] Test RLS policies:

  ```typescript
  test('users cannot access other users data', async () => {
    const user1Client = createClientForUser(user1)
    const user2Client = createClientForUser(user2)

    // Try to access user2's data with user1's client
    const { data, error } = await user1Client
      .from('pain_points')
      .select()
      .eq('user_id', user2.id)

    expect(data).toHaveLength(0)
    expect(error).toBeNull() // RLS filters, doesn't error
  })
  ```

- [ ] Test API route protection
- [ ] Test admin-only functionality (if any)
- [ ] Verify no data leakage between users

#### [ ] 8.4.3 OAuth security audit

- [ ] Verify state parameter validation (CSRF)
- [ ] Test PKCE implementation for Twitter
- [ ] Verify token encryption in database
- [ ] Test token refresh flows
- [ ] Verify redirect URI validation
- [ ] Check for token leakage in logs/errors

#### [ ] 8.4.4 GitHub webhook security

- [ ] Verify webhook signature validation:

  ```typescript
  test('invalid signature is rejected', async () => {
    const payload = JSON.stringify({ action: 'opened' })
    const invalidSignature = 'sha256=invalid'

    const response = await fetch('/api/github/webhook', {
      method: 'POST',
      headers: {
        'x-hub-signature-256': invalidSignature,
        'x-github-event': 'issues',
      },
      body: payload,
    })

    expect(response.status).toBe(401)
  })
  ```

- [ ] Test replay attack prevention
- [ ] Verify webhook secret storage security
- [ ] Test rate limiting

#### [ ] 8.4.5 Data security audit

- [ ] Verify sensitive data encryption (tokens, secrets)
- [ ] Test data sanitization (XSS prevention):

  ```typescript
  test('user input is sanitized', async () => {
    const maliciousInput = '<script>alert("XSS")</script>'

    await page.fill('[name="content"]', maliciousInput)
    await page.click('button[type="submit"]')

    const content = await page.textContent('.content')
    expect(content).not.toContain('<script>')
  })
  ```

- [ ] Verify SQL injection prevention
- [ ] Test file upload security (if applicable)
- [ ] Check for exposed environment variables

#### [ ] 8.4.6 API security testing

- [ ] Test rate limiting on all endpoints
- [ ] Verify input validation
- [ ] Test authentication on protected routes
- [ ] Check for excessive data exposure
- [ ] Test CORS configuration
- [ ] Verify no sensitive data in error messages

### 8.5 Performance Testing

#### [ ] 8.5.1 Measure Core Web Vitals

- [ ] Run Lighthouse audits:
  ```bash
  npx lighthouse https://app.devconsul.com --view
  ```
- [ ] Target metrics:
  - LCP (Largest Contentful Paint) < 2.5s
  - FID (First Input Delay) < 100ms
  - CLS (Cumulative Layout Shift) < 0.1
- [ ] Fix any failing metrics
- [ ] Test on 3G/4G networks

#### [ ] 8.5.2 Load testing

- [ ] Install k6: `brew install k6` (or npm)
- [ ] Create load test script:

  ```javascript
  import http from 'k6/http'
  import { check } from 'k6'

  export const options = {
    vus: 100,
    duration: '30s',
  }

  export default function () {
    const res = http.get('https://app.devconsul.com')
    check(res, { 'status is 200': (r) => r.status === 200 })
  }
  ```

- [ ] Run load tests: `k6 run load-test.js`
- [ ] Test API endpoints under load
- [ ] Identify bottlenecks
- [ ] Optimize slow queries/routes

#### [ ] 8.5.3 Database performance testing

- [ ] Run EXPLAIN ANALYZE on slow queries
- [ ] Add missing indexes
- [ ] Optimize N+1 queries
- [ ] Test with large datasets (1M+ records)
- [ ] Implement pagination for large results
- [ ] Monitor query execution times

#### [ ] 8.5.4 Optimize bundle size

- [ ] Run bundle analyzer:
  ```bash
  npm run build
  npx @next/bundle-analyzer
  ```
- [ ] Identify large dependencies
- [ ] Implement code splitting
- [ ] Lazy load components
- [ ] Remove unused dependencies
- [ ] Target total bundle < 200KB (gzipped)

### 8.6 Error Handling & Monitoring

#### [ ] 8.6.1 Verify Sentry integration

- [ ] Trigger test errors to verify Sentry capturing
- [ ] Check error grouping in Sentry
- [ ] Verify source maps uploaded
- [ ] Test error alerts triggering
- [ ] Verify PII is not logged

#### [ ] 8.6.2 Test error boundaries

- [ ] Verify error boundaries catch errors
- [ ] Test error recovery (reset functionality)
- [ ] Check error UI displays correctly
- [ ] Verify errors logged to Sentry

#### [ ] 8.6.3 Implement graceful degradation

- [ ] Test app with JavaScript disabled
- [ ] Test with failed external services (Reddit API down)
- [ ] Show appropriate error messages
- [ ] Provide fallback functionality where possible

#### [ ] 8.6.4 Phase 8 completion checklist

- [ ] All critical user flows tested
- [ ] Unit test coverage >80%
- [ ] Integration tests passing
- [ ] E2E tests covering main journeys
- [ ] Security audit completed
- [ ] Performance metrics meeting targets
- [ ] Error handling robust
- [ ] Update **CURRENT STATUS** section to Phase 9

---

## PHASE 9: MVP LAUNCH

**Duration**: Week 10
**Status**: 🔴 Not Started
**Context**: Final production deployment, monitoring, and soft launch

### Dependencies:

- All phases 1-8 completed
- All tests passing
- Security audit passed
- Performance targets met

### 9.1 Pre-Launch Preparation

#### [ ] 9.1.1 Production environment setup

- [ ] Create production Supabase project (separate from dev)
- [ ] Run all database migrations on production
- [ ] Verify RLS policies active in production
- [ ] Setup production Vercel project
- [ ] Configure production domain (e.g., app.devconsul.com)
- [ ] Setup SSL certificates (auto via Vercel)

#### [ ] 9.1.2 Environment variables verification

- [ ] Verify all production environment variables in Vercel:
  ```bash
  # Checklist
  ✓ NEXT_PUBLIC_SUPABASE_URL (production)
  ✓ NEXT_PUBLIC_SUPABASE_ANON_KEY (production)
  ✓ SUPABASE_SERVICE_ROLE_KEY (production)
  ✓ REDDIT_CLIENT_ID (production app)
  ✓ REDDIT_CLIENT_SECRET (production app)
  ✓ LINKEDIN_CLIENT_ID (production app)
  ✓ LINKEDIN_CLIENT_SECRET (production app)
  ✓ TWITTER_CLIENT_ID (production app)
  ✓ TWITTER_CLIENT_SECRET (production app)
  ✓ GITHUB_APP_ID (production app)
  ✓ GITHUB_CLIENT_ID (production app)
  ✓ GITHUB_CLIENT_SECRET (production app)
  ✓ GITHUB_WEBHOOK_SECRET (production secret)
  ✓ GITHUB_PRIVATE_KEY (production key)
  ✓ INNGEST_EVENT_KEY (production)
  ✓ INNGEST_SIGNING_KEY (production)
  ✓ SENTRY_DSN (production)
  ✓ SENTRY_AUTH_TOKEN (production)
  ✓ OPENAI_API_KEY (production)
  ```
- [ ] Test each integration in production environment
- [ ] Verify no development keys in production

#### [ ] 9.1.3 Update OAuth redirect URIs

- [ ] Update Reddit app callback: `https://app.devconsul.com/api/auth/callback/reddit`
- [ ] Update LinkedIn app callback: `https://app.devconsul.com/api/auth/callback/linkedin`
- [ ] Update Twitter app callback: `https://app.devconsul.com/api/auth/callback/twitter`
- [ ] Update GitHub app webhook: `https://app.devconsul.com/api/github/webhook`
- [ ] Test all OAuth flows in production

#### [ ] 9.1.4 Database optimization

- [ ] Run vacuum/analyze on production database
- [ ] Verify all indexes created
- [ ] Setup database backups (daily via Supabase)
- [ ] Configure backup retention (30 days)
- [ ] Test database restore procedure

#### [ ] 9.1.5 CDN and caching setup

- [ ] Verify Vercel Edge Network enabled
- [ ] Configure cache headers for static assets
- [ ] Setup CDN caching rules
- [ ] Test cache invalidation
- [ ] Optimize image delivery (Next.js Image)

### 9.2 Documentation

#### [ ] 9.2.1 User documentation

- [ ] Create user guide: `docs/user-guide.md`:
  - Getting started
  - Connecting social accounts
  - Installing GitHub App
  - Managing pain points
  - Configuring devlog
  - Understanding analytics
- [ ] Create FAQ document
- [ ] Create video walkthrough (optional)
- [ ] Create screenshots for each feature

#### [ ] 9.2.2 API documentation

- [ ] Document all API endpoints:

  ```markdown
  ## POST /api/github/webhook

  Receives GitHub webhook events

  **Headers**:

  - `x-hub-signature-256`: Webhook signature
  - `x-github-event`: Event type

  **Body**: GitHub webhook payload

  **Response**: 200 OK
  ```

- [ ] Document authentication flows
- [ ] Document webhook signatures
- [ ] Create Postman collection (if applicable)

#### [ ] 9.2.3 Architecture documentation

- [ ] Update `docs/architecture.md`:
  - System architecture diagram
  - Data flow diagrams
  - Integration points
  - Technology stack
- [ ] Document deployment architecture
- [ ] Document security measures
- [ ] Create entity relationship diagram (ERD)

#### [ ] 9.2.4 Troubleshooting guide

- [ ] Create `docs/troubleshooting.md`:
  - Common errors and solutions
  - OAuth connection issues
  - Webhook debugging
  - Performance issues
  - Database connection problems
- [ ] Document how to access logs
- [ ] Document how to contact support

#### [ ] 9.2.5 Developer documentation

- [ ] Update README.md with:
  - Project overview
  - Setup instructions
  - Development workflow
  - Testing procedures
  - Deployment process
- [ ] Document code structure
- [ ] Document coding conventions
- [ ] Create contributing guide (if open source)

### 9.3 Monitoring & Alerts

#### [ ] 9.3.1 Setup uptime monitoring

- [ ] Create account on Better Uptime or UptimeRobot
- [ ] Add monitors for:
  - Homepage (https://app.devconsul.com)
  - API health endpoint (/api/health)
  - Authentication endpoint (/api/auth/session)
  - GitHub webhook endpoint (expected 401 without auth)
- [ ] Set check interval: 1 minute
- [ ] Configure alert channels (email, Slack)
- [ ] Test alerts by pausing service

#### [ ] 9.3.2 Configure Sentry alerts

- [ ] Go to Sentry → Alerts
- [ ] Create alert: "High Error Rate"
  - Condition: >10 errors in 1 hour
  - Action: Email + Slack notification
- [ ] Create alert: "New Critical Error"
  - Condition: Error with level=error
  - Action: Immediate email
- [ ] Create alert: "Performance Degradation"
  - Condition: p95 transaction duration >2s
  - Action: Email notification
- [ ] Test alerts by triggering errors

#### [ ] 9.3.3 Setup log aggregation

- [ ] Configure Vercel log drains (if needed)
- [ ] Setup log retention policy
- [ ] Configure log search and filtering
- [ ] Create log dashboards for:
  - Authentication events
  - API errors
  - Webhook events
  - Performance metrics

#### [ ] 9.3.4 Create observability dashboard

- [ ] Install Vercel Analytics (if not already)
- [ ] Configure custom metrics:

  ```typescript
  import { track } from '@vercel/analytics'

  track('pain_point_extracted', { platform: 'reddit' })
  track('github_issue_created', { repo: repoName })
  track('devlog_posted', { engagement: likes + retweets })
  ```

- [ ] Create dashboard with key metrics:
  - Active users
  - Pain points extracted
  - GitHub issues created
  - Devlog posts published
  - API response times
  - Error rates
- [ ] Setup daily/weekly metric reports

#### [ ] 9.3.5 Configure incident response

- [ ] Create incident response plan:
  - Who to notify
  - Escalation procedures
  - Communication templates
  - Rollback procedures
- [ ] Create runbook for common issues:
  - Database connection failures
  - OAuth token expiry
  - API rate limit exceeded
  - Deployment failures
- [ ] Setup on-call rotation (if team)
- [ ] Create status page (e.g., status.devconsul.com)

### 9.4 Final Testing

#### [ ] 9.4.1 Production smoke tests

- [ ] Test user signup flow in production
- [ ] Test login flow
- [ ] Test connecting all social accounts
- [ ] Test GitHub App installation
- [ ] Test pain point extraction
- [ ] Test GitHub issue creation
- [ ] Test devlog posting
- [ ] Test analytics dashboard

#### [ ] 9.4.2 Load testing in production

- [ ] Run k6 load test against production:
  ```bash
  k6 run --vus 50 --duration 5m load-test.js
  ```
- [ ] Monitor metrics during load test:
  - Response times
  - Error rates
  - Database connections
  - Memory usage
  - CPU usage
- [ ] Verify auto-scaling works (Vercel)
- [ ] Check for any errors in Sentry

#### [ ] 9.4.3 Security final check

- [ ] Run OWASP ZAP security scan:
  ```bash
  docker run -t owasp/zap2docker-stable zap-baseline.py -t https://app.devconsul.com
  ```
- [ ] Fix any high/medium severity issues
- [ ] Verify all HTTPS redirects working
- [ ] Check for exposed secrets/keys
- [ ] Verify CSP headers configured
- [ ] Run npm audit: `npm audit --production`
- [ ] Fix any high/critical vulnerabilities

#### [ ] 9.4.4 Performance final check

- [ ] Run Lighthouse on all key pages:
  - Homepage: Target score >90
  - Dashboard: Target score >85
  - Inbox: Target score >85
  - Analytics: Target score >80
- [ ] Fix any Core Web Vitals issues
- [ ] Verify bundle sizes optimized
- [ ] Check database query performance
- [ ] Verify caching working correctly

### 9.5 Soft Launch

#### [ ] 9.5.1 Beta user recruitment

- [ ] Identify 5-10 beta users:
  - Indie developers
  - Technical founders
  - Developer advocates
  - Early adopters
- [ ] Send beta invitations
- [ ] Create beta user guide
- [ ] Setup beta feedback channel (Discord/Slack)
- [ ] Prepare onboarding emails

#### [ ] 9.5.2 Beta user onboarding

- [ ] Create beta user accounts manually (if needed)
- [ ] Send welcome emails with:
  - Login credentials
  - Getting started guide
  - Feature overview
  - Feedback form link
- [ ] Schedule onboarding calls (optional)
- [ ] Create private beta Slack channel
- [ ] Monitor beta user activity closely

#### [ ] 9.5.3 Gather initial feedback

- [ ] Create feedback form (Google Forms/Typeform):
  - Overall experience rating
  - Ease of use
  - Feature requests
  - Bug reports
  - Would you recommend?
- [ ] Schedule feedback sessions:
  - 1:1 calls with beta users
  - Group feedback sessions
  - Async feedback collection
- [ ] Track feature usage analytics
- [ ] Monitor error rates and user pain points

#### [ ] 9.5.4 Iterate based on feedback

- [ ] Create issues for critical bugs
- [ ] Prioritize quick wins and fixes
- [ ] Implement high-priority improvements
- [ ] Deploy hotfixes as needed
- [ ] Communicate updates to beta users
- [ ] Track satisfaction improvements

### 9.6 Public Launch Preparation

#### [ ] 9.6.1 Marketing materials

- [ ] Create landing page (separate from app)
- [ ] Create demo video/GIF
- [ ] Prepare launch tweet thread
- [ ] Write launch blog post
- [ ] Create Product Hunt page (draft)
- [ ] Prepare Reddit/HN posts
- [ ] Create press kit (screenshots, logos)

#### [ ] 9.6.2 Launch readiness checklist

- [ ] All critical bugs fixed
- [ ] Beta user feedback incorporated
- [ ] Performance targets met
- [ ] Security audit passed
- [ ] Documentation complete
- [ ] Monitoring and alerts active
- [ ] Support channels ready (email, chat)
- [ ] Pricing/billing ready (if applicable)
- [ ] Terms of Service & Privacy Policy published

#### [ ] 9.6.3 Launch day plan

- [ ] Schedule launch time (Tuesday-Thursday, 6am PT optimal)
- [ ] Prepare monitoring dashboard
- [ ] Have rollback plan ready
- [ ] Schedule team availability (if team)
- [ ] Prepare launch announcements:
  - Twitter/X
  - LinkedIn
  - Product Hunt
  - Hacker News
  - Reddit (r/SideProject, r/IndieDev)
  - Dev.to
- [ ] Monitor launch metrics closely

#### [ ] 9.6.4 Post-launch monitoring (First 48 hours)

- [ ] Monitor error rates every hour
- [ ] Track signups and activation rates
- [ ] Monitor performance metrics
- [ ] Respond to user questions/issues promptly
- [ ] Track social media engagement
- [ ] Fix any critical issues immediately
- [ ] Communicate status updates

#### [ ] 9.6.5 Post-launch review (Week 1)

- [ ] Analyze launch metrics:
  - Total signups
  - Activation rate (connected accounts)
  - Retention (daily active users)
  - Feature usage
  - Error rates
  - Performance metrics
- [ ] Gather user feedback
- [ ] Identify top priorities for v1.1
- [ ] Plan next iteration

### 9.7 Phase 9 Completion

#### [ ] 9.7.1 Final checklist

- [ ] Production deployment successful
- [ ] All monitoring and alerts active
- [ ] Documentation complete and published
- [ ] Beta testing completed
- [ ] Initial feedback incorporated
- [ ] Public launch executed
- [ ] Post-launch monitoring ongoing

#### [ ] 9.7.2 MVP completion celebration

- [ ] Document lessons learned
- [ ] Celebrate the launch! 🎉
- [ ] Plan v2 features based on feedback
- [ ] Setup ongoing maintenance schedule
- [ ] Archive development notes
- [ ] Update **CURRENT STATUS** to "MVP LAUNCHED ✅"

---

## 🎯 MVP LAUNCH SUCCESS CRITERIA

### Technical Metrics

- [ ] 99% uptime over first week
- [ ] <2s average page load time
- [ ] Zero critical security vulnerabilities
- [ ] <1% error rate
- [ ] 80%+ test coverage maintained

### User Metrics

- [ ] 10+ beta users successfully onboarded
- [ ] 50+ pain points extracted
- [ ] 20+ GitHub issues created from pain points
- [ ] 50+ devlog tweets posted
- [ ] Positive user feedback (NPS >7)

### Business Metrics

- [ ] Product launched to public
- [ ] Active monitoring and support in place
- [ ] User feedback collection active
- [ ] Feature roadmap defined for v2
- [ ] Sustainable development workflow established

---

## 📝 NOTES FOR CONTEXT RECOVERY

**When resuming after context clear**:

1. Read CURRENT STATUS section at top
2. Find your current phase
3. Review Context & Dependencies for that phase
4. Look for first unchecked `[ ]` task
5. Review completed tasks above it for context
6. Continue from unchecked task
7. Update checkboxes as you go: `[ ]` → `[x]`
8. Update CURRENT STATUS when phase completes

**Task Status Conventions**:

- `[ ]` = Not started
- `[x]` = Completed
- `[~]` = In progress (optional, use for long-running tasks)
- `[!]` = Blocked (add blocker note inline)

**Important Reminders**:

- Run tests after each phase
- Update documentation as you build
- Commit frequently with descriptive messages
- Keep CURRENT STATUS section updated
- Review completed tasks before starting new ones

---

## END OF TASKS.MD
