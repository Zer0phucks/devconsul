# DevConsul Setup Guide

This guide will help you set up the DevConsul development environment from scratch.

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Git
- Supabase account
- GitHub account

## Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd devconsul

# Run the setup script
./init.sh

# Start development server
npm run dev
```

## Manual Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy the environment template and fill in your values:

```bash
cp .env.example .env.local
```

Required variables for MVP:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (keep secret!)

See `.env.example` for all available configuration options.

### 3. Supabase Setup

#### Create Project
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Name: "devconsul-mvp"
4. Generate strong database password
5. Select region closest to your users
6. Wait for provisioning (~2 minutes)

#### Execute Database Migrations
1. Go to Supabase Dashboard → SQL Editor
2. Execute `migrations/001_initial_schema.sql`
3. Execute `migrations/002_rls_policies.sql`
4. Verify tables created in Table Editor

#### Configure Authentication
1. Go to Authentication → Settings
2. Set Site URL to `http://localhost:3000` (development)
3. Enable email confirmations
4. Configure password requirements
5. Customize email templates (optional)

#### Enable Realtime
1. Go to Database → Replication
2. Enable replication for:
   - `pain_points`
   - `social_connections`
   - `devlog_posts`

### 4. Verify Setup

```bash
# Run type check
npx tsc --noEmit

# Run linter
npm run lint

# Start dev server
npm run dev
```

Visit http://localhost:3000 to see the application.

## Development Workflow

### Git Workflow
1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and commit frequently
3. Submit to codex for review
4. Merge to main after approval

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `./init.sh` - Run full setup and checks
- `./init.sh --dev` - Setup and start dev server
- `./init.sh --test` - Setup and run tests

## Project Structure

```
devconsul/
├── src/
│   ├── app/              # Next.js app router pages
│   ├── components/       # React components
│   │   └── ui/          # shadcn/ui components
│   └── lib/             # Utility functions
│       └── supabase/    # Supabase clients
├── migrations/          # Database migrations
├── docs/               # Documentation
├── public/             # Static assets
└── init.sh            # Setup script
```

## Troubleshooting

### Environment Variables Not Loading
- Ensure `.env.local` exists in project root
- Restart development server after changing env vars
- Check for typos in variable names

### Database Connection Issues
- Verify Supabase project is running
- Check Project URL and keys are correct
- Ensure IP is not blocked (check Supabase dashboard)

### TypeScript Errors
- Run `npm install` to ensure all types are installed
- Check `tsconfig.json` is not modified
- Clear `.next` folder and restart: `rm -rf .next && npm run dev`

### Build Errors
- Clear caches: `rm -rf .next node_modules package-lock.json`
- Reinstall: `npm install`
- Check for conflicting dependencies

## Getting Help

- Check `TASKS.md` for project roadmap
- Review `docs/database.md` for schema details
- See `README.md` for project overview
- Submit issues to GitHub repository

## Next Steps

After setup is complete:
1. Review Phase 1 tasks in `TASKS.md`
2. Familiarize yourself with the database schema
3. Test authentication flow
4. Start implementing features

## Security Notes

- Never commit `.env.local` to version control
- Rotate secrets regularly
- Use service role key only in server-side code
- Enable RLS policies before deploying to production
- Review Supabase security checklist before launch
