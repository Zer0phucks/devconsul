# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router routes, API handlers, and server actions for monitor, admin, and blog views.
- `components/`: Shared Tailwind UI; keep client modules presentational and fetch data in server entries.
- `lib/`: Domain utilities (AI prompts in `lib/ai`, GitHub ingestion, mail helpers) consumed across features.
- `emails/`: React Email templates for Resend newsletters and digests; version alongside copy updates.
- `prisma/` & `scripts/`: Prisma schema/migrations plus onboarding helpers such as `scripts/setup-db.js`.
- `public/`, `docs/`, `content/`: Static assets and supporting markdown.

## Build, Test, and Development Commands
- `npm run dev`: Start Turbopack dev server on `http://localhost:3000`.
- `npm run build`: Production bundle validation; run before releases or Vercel deploys.
- `npm run lint`: ESLint with the Next.js config; required before committing or opening PRs.
- `npm run setup:db`: Bootstrap tables on first run or after destructive resets.
- `npm run db:migrate` (+ `npm run db:validate`): Apply schema changes and confirm integrity.
- `npm run db:seed` / `npm run db:studio`: Load demo content and inspect data during feature work.
- `npm run db:reset`: Recreate the schema from migrations if local state drifts.

## Coding Style & Naming Conventions
- TypeScript with 2-space indentation, double quotes, and `async/await`-first flow control.
- Components and hooks use PascalCase / camelCase (`AdminDashboard.tsx`, `useGithubFeed`).
- Tailwind classes stay inline; factor repeats with helpers in `lib/ui`.
- Secrets live in `.env.local`; never expose API keys in client bundles.

## Testing Guidelines
- Linting is the enforced baseline; run `npm run lint` before every push.
- Colocate new `*.spec.ts` or `*.test.tsx` files with their source and execute via `tsx` or the chosen runner.
- Capture sample AI or webhook payloads under `content/fixtures/` and document manual QA steps in PRs.

## Commit & Pull Request Guidelines
- Use Conventional Commits (`feat:`, `fix:`, `chore:`) with concise scope summaries.
- Keep commits focused, include Prisma migration files when schemas change, and list verification commands in PRs.
- Request reviews from the relevant domain owners and resolve comments before merging.

## Security & Configuration Tips
- Mirror the environment variable list in `README.md` and share secrets through Vercel or a password manager.
- Rotate credentials during onboarding/offboarding and scrub sensitive data from logs or fixtures before committing.
