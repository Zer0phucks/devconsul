# CLAUDE.md

# RULES

- Create tests before starting work and keep track of them in a structured format (e.g., tests.json).
- It is unacceptable to remove or edit tests because this could lead to missing or buggy functionality.
- create setup scripts (e.g., init.sh) to gracefully start servers, run test suites, and linters.
- Use specialized subagents for both parallel and sequential execution, helps to manage context, allowing you to maintain focus on the larger picture while subagents can focus on individual tasks.

## Project Overview

AI-powered content publishing platform that monitors GitHub activity, generates blog posts using AI, and publishes to multiple platforms. Built on Next.js 15 with App Router, TypeScript, Prisma, and Inngest for job processing.

## Development Commands

### Core Development
```bash
npm run dev          # Start development server with Turbopack
npm run build        # Production build with Turbopack
npm start            # Start production server
npm run lint         # Run ESLint
```

### Database Operations
```bash
npm run setup:db     # Initialize database schema
npm run db:migrate   # Run Prisma migrations
npm run db:seed      # Seed database with initial data
npm run db:studio    # Open Prisma Studio (database GUI)
npm run db:reset     # Reset database (destructive)
npm run db:validate  # Validate database schema
npm run db:generate  # Generate Prisma Client
```

## Architecture

### Directory Structure
```
app/              # Next.js 15 App Router pages and layouts
├── api/          # API route handlers (28 subdirectories)
├── dashboard/    # User dashboard UI
├── admin/        # Admin panel
├── blog/         # Public blog interface
├── docs/         # Documentation pages
├── auth/         # Authentication flows
└── onboarding/   # User onboarding wizard

lib/              # Core business logic and utilities (33 modules)
├── ai/           # AI content generation (OpenAI/Anthropic)
├── inngest/      # Background job processing
├── platforms/    # Platform integrations (Dev.to, Hashnode, Medium, etc.)
├── github/       # GitHub API integration and webhooks
├── analytics/    # Analytics and metrics collection
├── publishing/   # Content publishing engine
├── scheduling/   # Content scheduling system
├── reporting/    # Report generation
├── monitoring/   # Performance and health monitoring
└── validations/  # Zod schema validators

components/       # React components (19 feature directories)
prisma/          # Prisma schema and migrations
emails/          # React Email templates
```

### Key Architectural Patterns

**AI Content Generation Flow:**
- GitHub activity monitoring → AI content generation → Multi-platform publishing
- Primary provider: OpenAI (GPT-4), Fallback: Anthropic (Claude)
- Content generation in `lib/ai/content-generator.ts`
- Configurable via `AIGenerationConfig` interface

**Background Job Processing (Inngest):**
- Event-driven architecture for async operations
- Key jobs: content generation, scheduled publishing, GitHub sync, report generation
- Client configuration: `lib/inngest/client.ts`
- Functions: `lib/inngest/functions/`
- Event schemas strongly typed via TypeScript

**Database Architecture (Prisma + PostgreSQL):**
- 60+ models covering users, projects, content, platforms, analytics, scheduling
- Multi-tenant via `projectId` foreign keys
- Content versioning and approval workflows
- Comprehensive audit logging
- Key models: User, Project, Content, Platform, ScheduledContent, ContentPublication

**Publishing Pipeline:**
1. Content creation (manual or AI-generated)
2. Optional approval workflow (`ContentApproval`)
3. Safety checks (`ContentSafetyCheck`)
4. Scheduling (`ScheduledContent`)
5. Platform publication (`ContentPublication`)
6. Analytics tracking (`ContentMetrics`, `PlatformMetrics`)

**Platform Integration Strategy:**
- Adapter pattern for platform-specific implementations
- OAuth and API key authentication
- Platform-specific content transformation
- Retry logic with exponential backoff
- Supported: Hashnode, Dev.to, Medium, LinkedIn, Twitter, WordPress, Ghost, Newsletter platforms (Resend, SendGrid, Mailchimp)

### Critical System Components

**Middleware (`middleware.ts`):**
- Session management with NextAuth
- Rate limiting
- Request validation
- Must maintain auth checks for `/admin` and `/dashboard` routes

**Authentication (`lib/auth.ts`):**
- NextAuth v5 with Prisma adapter
- OAuth providers: Google, GitHub
- Credentials provider for email/password
- Session strategy: database-backed

**Content Safety System:**
- Pre-publish validation pipeline
- Blacklist/whitelist term filtering
- AI-powered moderation (OpenAI Moderation API)
- PII and credential detection
- Configurable severity levels

**Scheduling System:**
- Timezone-aware scheduling
- Recurring content support
- Conflict detection
- Queue management with priority
- Inngest-powered execution

## Configuration Files

**Environment Variables (`.env`):**
- Database: `DATABASE_URL`
- Auth: `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, OAuth credentials
- AI: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `AI_PROVIDER`
- Email: `RESEND_API_KEY`, `SENDGRID_API_KEY`, `MAILCHIMP_API_KEY`
- See `.env.example` for complete list

**TypeScript Configuration:**
- Strict mode enabled
- Path alias: `@/*` maps to project root
- Target: ES2017
- Module resolution: bundler

**Prisma Schema:**
- Single schema file: `prisma/schema.prisma`
- PostgreSQL provider (Supabase/Neon compatible)
- Generated client in `node_modules/@prisma/client`

## Development Workflows

### Adding New Platform Integration
1. Create adapter in `lib/platforms/<platform-name>/`
2. Implement platform-specific publishing logic
3. Add OAuth/API configuration in platform model
4. Update `PlatformType` enum in schema
5. Add validation schema in `lib/validations/platform-connection.ts`
6. Create UI components in `components/platforms/`

### Modifying AI Generation
- Primary logic: `lib/ai/content-generator.ts`
- Prompt templates: `lib/ai/prompts/`
- Configuration interface: `AIGenerationConfig` in `lib/types.ts`
- Test generation without publishing via dry-run system

### Database Schema Changes
```bash
# 1. Modify prisma/schema.prisma
# 2. Create migration
npx prisma migrate dev --name descriptive_name
# 3. Generate client
npm run db:generate
# 4. Update TypeScript types if needed
```

### Background Job Development
1. Define event schema in `lib/inngest/client.ts` (`Events` type)
2. Create function in `lib/inngest/functions/`
3. Register in `app/api/inngest/route.ts`
4. Test with Inngest Dev Server

## Important Constraints

- **Turbopack:** Build and dev commands use `--turbopack` flag
- **React 19:** Uses React 19.1.0 - check component compatibility
- **Next.js 15:** App Router only, no Pages directory
- **Database:** PostgreSQL only, schema uses advanced Prisma features
- **Inngest:** All background jobs must go through Inngest, no direct async operations
- **NextAuth v5:** Beta version - authentication patterns differ from v4
- **Content Safety:** All AI-generated content MUST pass safety checks before publishing

## Testing Strategy

### Dry Run System
- Full publishing simulation without actual publication
- Validation checks: character limits, image sizes, link validity, rate limits
- Mock publication records in `MockPublication` model
- Test reports generated in multiple formats
- Access via `/dashboard/test` or API endpoints

### Key Test Scenarios
- Content generation with different AI providers
- Platform connectivity and authentication
- Scheduling with timezone conversions
- Safety check bypasses
- Approval workflow state transitions

## Performance Considerations

- **Monitoring:** Inngest job metrics tracked in `JobMetrics` model
- **Performance baselines:** Regression detection via `PerformanceBaseline`
- **Dead letter queue:** Failed jobs logged in `DeadLetterQueue`
- **Caching:** Vercel KV for activity storage and rate limiting
- **Database indexing:** Extensive indexes on high-query columns (see schema)

## Error Handling

- **Sentry integration:** Error tracking via `@sentry/nextjs`
- **Error logging:** Database-backed in `ErrorLog` model
- **Pattern detection:** Recurring errors tracked in `ErrorPattern`
- **Alert system:** Critical errors generate alerts in `Alert` model
- **Graceful degradation:** AI provider fallback, retry logic on platform errors

## Common Gotchas

1. **Prisma Client Generation:** Must run `db:generate` after schema changes
2. **Environment Variables:** Inngest requires `INNGEST_EVENT_KEY` in production
3. **Turbopack Mode:** Some packages may have compatibility issues with Turbopack
4. **Session Storage:** NextAuth sessions stored in database, not JWT
5. **Content Status:** Draft → Scheduled → Published flow enforced via state machine
6. **Timezone Handling:** Always use IANA timezone strings, stored in UTC
7. **Image Storage:** Vercel Blob URLs expire, must track in `Image` model
8. **Platform Rate Limits:** Implemented per-platform in adapter layer
