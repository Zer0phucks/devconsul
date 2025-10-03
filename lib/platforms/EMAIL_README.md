# Email Platform Integrations

Comprehensive email delivery system supporting Resend, SendGrid, and Mailchimp with CAN-SPAM compliance.

## Features

- ✅ **Multiple Providers**: Resend, SendGrid, Mailchimp
- ✅ **Template System**: 4 responsive email templates (newsletter, announcement, digest, plain)
- ✅ **Markdown Support**: Convert markdown to email-safe HTML
- ✅ **Campaign Management**: Create, schedule, and send campaigns
- ✅ **Unsubscribe System**: CAN-SPAM compliant opt-out handling
- ✅ **Email Tracking**: Opens, clicks, bounces, deliveries
- ✅ **Contact Management**: Lists, audiences, subscribers
- ✅ **Spam Prevention**: Content analysis and best practices

## Quick Start

### Environment Variables

```env
# Resend
RESEND_API_KEY=re_xxx
FROM_EMAIL=newsletter@yourdomain.com
FROM_NAME=Your Company
REPLY_TO_EMAIL=support@yourdomain.com

# SendGrid
SENDGRID_API_KEY=SG.xxx

# Mailchimp
MAILCHIMP_API_KEY=xxx
MAILCHIMP_SERVER=us1
MAILCHIMP_CLIENT_ID=xxx
MAILCHIMP_CLIENT_SECRET=xxx

# Application
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Database Migration

```bash
npx prisma migrate dev --name add_email_platforms
```

## Usage Examples

### Send Email with Resend

```typescript
import { getDefaultResendClient } from '@/lib/platforms';

const client = getDefaultResendClient();

const result = await client.sendEmail(
  'user@example.com',
  'Welcome to Our Newsletter',
  '<h1>Hello!</h1><p>Thanks for subscribing.</p>',
  {
    trackOpens: true,
    trackClicks: true,
  }
);
```

### Send Bulk Email

```typescript
const recipients = [
  { email: 'user1@example.com', name: 'John' },
  { email: 'user2@example.com', name: 'Jane' },
];

const result = await client.sendBulkEmail(
  recipients,
  'Newsletter Update',
  '<h1>Hello {name}</h1><p>Latest news...</p>'
);

console.log(`Sent: ${result.sent}, Failed: ${result.failed}`);
```

### Use Email Template

```typescript
import { markdownToEmailHtml } from '@/lib/platforms';

const markdown = `
# New Feature Released

We're excited to announce **AI-powered content generation**!

## Key Features

- Automated newsletter creation
- Multi-platform publishing
- Smart scheduling
`;

const html = await markdownToEmailHtml(markdown, {
  inlineCss: true,
  maxImageWidth: 600,
  trackLinks: true,
});

await client.sendEmail('subscribers@example.com', 'New Features', html);
```

### Create Campaign

```typescript
import { prisma } from '@/lib/db';

const campaign = await prisma.emailCampaign.create({
  data: {
    projectId: 'your-project-id',
    name: 'Q1 2025 Newsletter',
    subject: 'Quarterly Update - Amazing Progress!',
    fromEmail: 'newsletter@company.com',
    fromName: 'Company Newsletter',
    htmlContent: emailHtml,
    emailProvider: 'RESEND',
    status: 'DRAFT',
  },
});

// Add recipients
await prisma.emailRecipient.createMany({
  data: recipients.map(r => ({
    campaignId: campaign.id,
    email: r.email,
    name: r.name,
  })),
});
```

### Send Campaign

```typescript
import { createResendClientFromPlatform } from '@/lib/platforms';

const platform = await prisma.platform.findFirst({
  where: { type: 'RESEND', projectId: 'your-project-id' },
});

const client = await createResendClientFromPlatform(platform.id);

await client.sendCampaign(campaign.id, (sent, total) => {
  console.log(`Progress: ${sent}/${total}`);
});
```

### Check Unsubscribe Status

```typescript
import { isEmailUnsubscribed, filterUnsubscribedEmails } from '@/lib/platforms';

// Check single email
const unsubscribed = await isEmailUnsubscribed('user@example.com');

// Filter list
const emails = ['user1@example.com', 'user2@example.com'];
const activeEmails = await filterUnsubscribedEmails(emails);
```

## API Endpoints

### GET /api/platforms/email

Get email platforms for a project.

**Query Parameters:**
- `projectId` (required): Project ID

**Response:**
```json
{
  "platforms": [
    {
      "id": "platform-id",
      "type": "RESEND",
      "name": "Production Email",
      "isConnected": true,
      "lastConnectedAt": "2025-01-15T10:00:00Z",
      "totalPublished": 1250
    }
  ]
}
```

### POST /api/platforms/email

Send email or manage campaigns.

**Actions:**

#### Send Email

```json
{
  "action": "send",
  "platformId": "platform-id",
  "to": "user@example.com",
  "subject": "Welcome",
  "html": "<h1>Hello</h1>",
  "trackOpens": true
}
```

#### Create Campaign

```json
{
  "action": "create-campaign",
  "projectId": "project-id",
  "name": "Newsletter Q1",
  "subject": "Quarterly Update",
  "fromEmail": "newsletter@company.com",
  "htmlContent": "<html>...",
  "emailProvider": "RESEND"
}
```

#### Send Campaign

```json
{
  "action": "send-campaign",
  "campaignId": "campaign-id"
}
```

### POST /api/unsubscribe

Unsubscribe from emails.

**Request:**
```json
{
  "token": "unsubscribe-token",
  "reason": "Too many emails"
}
```

### GET /api/unsubscribe/info?token=xxx

Get unsubscribe information.

**Response:**
```json
{
  "email": "user@example.com",
  "campaignName": "Weekly Newsletter",
  "projectName": "My Blog"
}
```

## Platform-Specific Features

### Resend

**Features:**
- Simple API
- High deliverability
- Built-in tracking
- Attachment support

**Best For:**
- Transactional emails
- Developer-friendly integration
- Quick setup

**Example:**
```typescript
const client = createResendClient({
  apiKey: process.env.RESEND_API_KEY!,
  fromEmail: 'noreply@company.com',
  fromName: 'Company Name',
});
```

### SendGrid

**Features:**
- Dynamic templates
- Contact list management
- Advanced analytics
- Marketing campaigns

**Best For:**
- Large-scale email campaigns
- Advanced segmentation
- A/B testing

**Example:**
```typescript
const client = createSendGridClient({
  apiKey: process.env.SENDGRID_API_KEY!,
  fromEmail: 'marketing@company.com',
});

// Send with dynamic template
await client.sendTransactional(
  'user@example.com',
  'template-id',
  { name: 'John', orderNumber: '12345' }
);
```

### Mailchimp

**Features:**
- Audience management
- Campaign builder
- Automation workflows
- Comprehensive analytics

**Best For:**
- Marketing automation
- Audience segmentation
- Newsletter management

**OAuth Setup:**
```typescript
import { getMailchimpAuthUrl, exchangeMailchimpCode } from '@/lib/platforms';

// 1. Redirect to OAuth
const authUrl = getMailchimpAuthUrl({
  clientId: process.env.MAILCHIMP_CLIENT_ID!,
  clientSecret: process.env.MAILCHIMP_CLIENT_SECRET!,
  redirectUri: 'https://app.com/oauth/mailchimp/callback',
});

// 2. Exchange code for token
const tokens = await exchangeMailchimpCode(code, config);

// 3. Create client
const client = createMailchimpClient({
  apiKey: tokens.accessToken,
  server: tokens.server,
});
```

## Email Templates

### Newsletter Template

```typescript
import { NewsletterEmail } from '@/lib/platforms';
import { render } from '@react-email/render';

const html = render(
  <NewsletterEmail
    title="Weekly Update"
    content="<p>Latest news...</p>"
    author="Editorial Team"
    date={new Date().toISOString()}
    unsubscribeUrl="https://app.com/unsubscribe/token"
  />
);
```

### Announcement Template

```typescript
import { AnnouncementEmail } from '@/lib/platforms';

const html = render(
  <AnnouncementEmail
    title="New Feature Launch"
    content="<p>We're excited to announce...</p>"
    ctaText="Try it Now"
    ctaUrl="https://app.com/features"
    unsubscribeUrl="https://app.com/unsubscribe/token"
  />
);
```

### Digest Template

```typescript
import { DigestEmail } from '@/lib/platforms';

const html = render(
  <DigestEmail
    title="Weekly Digest"
    introduction="Here are this week's top articles"
    items={[
      {
        title: 'Article 1',
        excerpt: 'Summary...',
        url: 'https://blog.com/article-1',
        date: '2025-01-15',
      },
    ]}
    unsubscribeUrl="https://app.com/unsubscribe/token"
  />
);
```

## Best Practices

### 1. Content Optimization

```typescript
import { checkSpamScore } from '@/lib/platforms';

const { score, triggers } = checkSpamScore(emailContent);

if (score > 5) {
  console.warn('High spam score:', triggers);
  // Revise content
}
```

### 2. CAN-SPAM Compliance

```typescript
import { validateCanSpamCompliance, addPhysicalAddress } from '@/lib/platforms';

let html = emailContent;

// Validate
const { compliant, issues } = validateCanSpamCompliance(html);
if (!compliant) {
  console.warn('Compliance issues:', issues);
}

// Add required elements
html = addPhysicalAddress(html, {
  company: 'Company Name',
  street: '123 Main St',
  city: 'San Francisco',
  state: 'CA',
  zip: '94102',
});
```

### 3. Unsubscribe Handling

```typescript
// Always check before sending
const canSend = !(await isEmailUnsubscribed(email));

if (!canSend) {
  console.log('Email is unsubscribed');
  return;
}

// Include unsubscribe link
const unsubscribeUrl = generateUnsubscribeUrl(recipientToken);
html = addUnsubscribeFooter(html, unsubscribeUrl);
```

### 4. Error Handling

```typescript
try {
  const result = await client.sendEmail(to, subject, html);

  if (result.error) {
    // Log error, retry logic, etc.
    await prisma.emailRecipient.update({
      where: { id: recipientId },
      data: { status: 'FAILED', errorMsg: result.error },
    });
  }
} catch (error) {
  console.error('Send failed:', error);
}
```

## Testing

### Test Email Sending

```typescript
// Test with real provider
const client = getDefaultResendClient();

const result = await client.sendEmail(
  'test@yourdomain.com',
  'Test Email',
  '<h1>Test</h1><p>This is a test email.</p>'
);

console.log('Send result:', result);
```

### Test Unsubscribe Flow

1. Create test campaign with recipients
2. Send email with unsubscribe token
3. Click unsubscribe link
4. Verify email added to unsubscribe list
5. Test that email is filtered from future sends

## Monitoring

### Get Campaign Stats

```typescript
const campaign = await prisma.emailCampaign.findUnique({
  where: { id: campaignId },
  include: { recipients: true },
});

const stats = {
  total: campaign.totalRecipients,
  sent: campaign.totalSent,
  delivered: campaign.totalDelivered,
  opened: campaign.totalOpened,
  clicked: campaign.totalClicked,
  bounced: campaign.totalBounced,
  unsubscribed: campaign.totalUnsubscribed,
  openRate: (campaign.totalOpened / campaign.totalSent) * 100,
  clickRate: (campaign.totalClicked / campaign.totalSent) * 100,
};
```

### Get Unsubscribe Stats

```typescript
import { getUnsubscribeStats } from '@/lib/platforms';

const stats = await getUnsubscribeStats();
console.log(`Total unsubscribed: ${stats.active}`);
console.log(`By project:`, stats.byProject);
```

## Troubleshooting

### Issue: Emails not sending

**Check:**
1. API keys configured correctly
2. From email verified with provider
3. Recipients not in unsubscribe list
4. Rate limits not exceeded

### Issue: Low deliverability

**Solutions:**
1. Verify sender domain (SPF, DKIM, DMARC)
2. Warm up IP address gradually
3. Maintain clean email lists
4. Reduce spam score
5. Include unsubscribe link

### Issue: Emails in spam folder

**Fix:**
1. Check spam score with `checkSpamScore()`
2. Avoid spam trigger words
3. Include physical address
4. Verify domain authentication
5. Send from consistent email address

## Support

For issues or questions:
- Check error logs in database (`errorMsg` field)
- Review platform documentation
- Verify API key permissions
- Test with provider's sandbox/test mode

## License

MIT License - See LICENSE file for details
