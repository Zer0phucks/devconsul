# DevConsul

Developer Authority & Engagement Platform - Build your reputation by solving real problems.

## Overview

DevConsul is a unified platform for developers to:
- Monitor mentions across Reddit, LinkedIn, and Twitter
- Extract and track pain points and problems
- Auto-create GitHub issues for building in public
- Automate devlog updates on Twitter
- Build developer authority through public problem-solving

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- Supabase account (for database)
- GitHub account (for issue integration)

### Environment Setup

1. Copy the environment template:
```bash
cp .env.example .env.local
```

2. Fill in the required environment variables in `.env.local`:

#### Supabase (Required for MVP)
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (keep secret)

#### Social OAuth (To be configured)
- Reddit, LinkedIn, Twitter credentials for API access

#### GitHub Integration (To be configured)
- GitHub App credentials for issue automation

#### Other Services (To be configured)
- Inngest (background job processing)
- Sentry (error monitoring)
- OpenAI (NLP for pain point extraction)

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Development Tools

This project uses:
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful, accessible components
- **Prettier** - Code formatting
- **ESLint** - Code linting
- **Husky** - Git hooks for code quality

## Project Structure

```
devconsul/
├── src/
│   ├── app/           # Next.js app router pages
│   ├── components/    # React components
│   │   └── ui/        # shadcn/ui components
│   └── lib/           # Utility functions
├── public/            # Static assets
├── TASKS.md           # Development roadmap
└── README.md          # This file
```

## Development Workflow

1. Check `TASKS.md` for current development status
2. Create feature branch for each task
3. Implement and test changes
4. Submit for review
5. Merge to main after approval

## Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Contributing

This is a personal project for building in public. Follow the tasks in `TASKS.md` for the development roadmap.

## License

Private project - Not licensed for public use
