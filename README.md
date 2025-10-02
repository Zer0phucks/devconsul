# AI GitHub Monitor & Blog Publisher

An automated system that monitors GitHub repository activity, generates AI-powered blog posts, and sends weekly newsletters - all deployed on Vercel.

## Features

- 🔄 **GitHub Activity Monitoring**: Real-time webhook integration to track commits, PRs, issues, and releases
- 🤖 **AI Content Generation**: Uses Vercel AI Gateway with GPT-4 to generate engaging blog posts
- 📝 **Automated Blog**: MDX-powered blog with automatic publishing of generated content
- 📧 **Newsletter System**: Weekly email digests sent to subscribers via Resend
- 🎛️ **Admin Dashboard**: Monitor activity, trigger content generation, and manage subscribers
- ⚡ **Edge-First Architecture**: Built on Vercel's edge runtime for optimal performance

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI**: Vercel AI SDK with OpenAI/Anthropic
- **Storage**:
  - Vercel Postgres (user data, blog posts)
  - Vercel KV (caching, activity storage)
  - Vercel Blob (images, attachments)
- **Email**: Resend with React Email
- **Deployment**: Vercel

## Setup Instructions

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd fullselfpublishing
npm install
```

### 2. Create Vercel Project

1. Push code to GitHub
2. Import to Vercel: https://vercel.com/new
3. Connect your GitHub repository

### 3. Set Up Vercel Storage

In your Vercel dashboard:

1. **Postgres Database**:
   - Go to Storage → Create Database → Postgres
   - Copy connection strings to environment variables

2. **KV Store**:
   - Go to Storage → Create Database → KV
   - Copy KV URLs and tokens

3. **Blob Storage**:
   - Go to Storage → Create Database → Blob
   - Copy read/write token

### 4. Configure Environment Variables

Copy `.env.example` to `.env.local` and fill in:

#### GitHub Configuration
- `GITHUB_TOKEN`: Create at https://github.com/settings/tokens
- `GITHUB_WEBHOOK_SECRET`: Generate a random secret
- `GITHUB_REPO_OWNER`: Your GitHub username
- `GITHUB_REPO_NAME`: Repository to monitor

#### AI Configuration
- `OPENAI_API_KEY`: Get from https://platform.openai.com
- `ANTHROPIC_API_KEY` (optional): From https://console.anthropic.com

#### Email Configuration
- `RESEND_API_KEY`: Get from https://resend.com
- `EMAIL_FROM`: Your verified email domain

#### Application
- `NEXT_PUBLIC_APP_URL`: Your Vercel deployment URL
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `ADMIN_PASSWORD_HASH`: Hash your admin password

### 5. Initialize Database

Create the required tables by running:

```bash
npm run setup:db
```

### 6. Set Up GitHub Webhook

1. Go to your GitHub repository settings
2. Navigate to Webhooks → Add webhook
3. Set Payload URL: `https://your-app.vercel.app/api/webhooks/github`
4. Set Content type: `application/json`
5. Set Secret: Your `GITHUB_WEBHOOK_SECRET`
6. Select events: Push, Pull requests, Issues, Releases

### 7. Configure Cron Jobs

The `vercel.json` file already configures weekly newsletter sending. Vercel will automatically set this up on deployment.

## Usage

### Blog

- Public blog: `/blog`
- Individual posts: `/blog/[slug]`
- RSS feed: `/blog/rss`

### Newsletter

- Subscribe page: `/newsletter`
- API endpoint: `/api/newsletter/subscribe`

### Admin Dashboard

- Access: `/admin` (password protected)
- Features:
  - View GitHub activity
  - Trigger content generation
  - Send newsletters manually
  - View statistics

## Development

### Local Development

```bash
npm run dev
```

Visit http://localhost:3000

### Testing Webhooks Locally

Use ngrok or similar to expose your local server:

```bash
ngrok http 3000
```

Then update your GitHub webhook URL to the ngrok URL.

## Content Generation Logic

The system automatically generates content when:

1. **Releases**: Any new release triggers immediate blog post
2. **Pull Requests**: Merged PRs trigger content generation
3. **Commits**: 5+ commits in a short period trigger summary post
4. **Weekly**: Newsletter generated from week's activities

Content generation uses AI to:
- Summarize technical changes
- Explain impact and benefits
- Create engaging narratives
- Generate appropriate tags

## Customization

### AI Prompts

Edit prompts in `lib/ai/content-generator.ts`:
- `createBlogPrompt()`: Blog post generation
- `createNewsletterPrompt()`: Newsletter content

### Styling

- Blog theme: `app/blog/layout.tsx`
- Email template: `emails/newsletter-template.tsx`
- Tailwind config: `tailwind.config.js`

### Content Rules

Modify in `lib/ai/content-generator.ts`:
- `shouldGenerateContent()`: When to auto-generate
- `parseGeneratedContent()`: Content parsing logic

## Monitoring

### Logs
- Vercel dashboard → Functions → Logs

### Analytics
- GitHub webhook deliveries
- Vercel Analytics (optional add-on)
- Email open/click rates in Resend

## Troubleshooting

### Webhook Issues
- Check GitHub webhook recent deliveries
- Verify signature in logs
- Ensure environment variables are set

### AI Generation
- Check OpenAI API key and credits
- Review generation prompts
- Check Vercel KV for stored activities

### Email Delivery
- Verify Resend API key
- Check domain verification
- Review subscriber status in database

## Security Considerations

- All webhooks are signature-verified
- Admin routes are password-protected
- Database credentials are encrypted
- API keys should never be exposed client-side
- Use environment variables for all secrets

## License

MIT

## Support

For issues or questions, please open a GitHub issue.
