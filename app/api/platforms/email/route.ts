import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth-helpers';
import { prisma } from '@/lib/db';
import {
  createResendClientFromPlatform,
  createSendGridClientFromPlatform,
  createMailchimpClientFromPlatform,
} from '@/lib/platforms';
import {
  sendEmailSchema,
  createCampaignSchema,
  addRecipientsSchema,
} from '@/lib/validations/email-platforms';
import { filterUnsubscribedEmails } from '@/lib/platforms/unsubscribe';

// GET /api/platforms/email - Get email platforms for project
export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 });
    }

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        user: { email: session.user.email },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const platforms = await prisma.platform.findMany({
      where: {
        projectId,
        type: { in: ['RESEND', 'SENDGRID', 'MAILCHIMP'] },
      },
      select: {
        id: true,
        type: true,
        name: true,
        isConnected: true,
        lastConnectedAt: true,
        totalPublished: true,
        config: true,
      },
    });

    return NextResponse.json({ platforms });
  } catch (error) {
    console.error('Get email platforms error:', error);
    return NextResponse.json(
      { error: 'Failed to get email platforms' },
      { status: 500 }
    );
  }
}

// POST /api/platforms/email - Send email or create campaign
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { action, platformId, projectId } = body;

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        user: { email: session.user.email },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    switch (action) {
      case 'send':
        return await handleSendEmail(body, platformId);
      case 'create-campaign':
        return await handleCreateCampaign(body, projectId);
      case 'send-campaign':
        return await handleSendCampaign(body);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { error: 'Failed to process email request' },
      { status: 500 }
    );
  }
}

// Handle send email
async function handleSendEmail(data: any, platformId: string) {
  const validation = sendEmailSchema.safeParse(data);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validation.error.issues },
      { status: 400 }
    );
  }

  const { to, subject, html, ...options } = validation.data;

  // Get platform
  const platform = await prisma.platform.findUnique({
    where: { id: platformId },
  });

  if (!platform) {
    return NextResponse.json({ error: 'Platform not found' }, { status: 404 });
  }

  // Filter unsubscribed emails
  const emails = Array.isArray(to) ? to : [to];
  const filteredEmails = await filterUnsubscribedEmails(emails);

  if (filteredEmails.length === 0) {
    return NextResponse.json(
      { error: 'All recipients are unsubscribed' },
      { status: 400 }
    );
  }

  // Send based on platform type
  let result;
  switch (platform.type) {
    case 'RESEND': {
      const client = await createResendClientFromPlatform(platformId);
      result = await client.sendEmail(filteredEmails, subject, html, options);
      break;
    }
    case 'SENDGRID': {
      const client = await createSendGridClientFromPlatform(platformId);
      result = await client.sendEmail(filteredEmails, subject, html, options);
      break;
    }
    default:
      return NextResponse.json(
        { error: 'Unsupported platform for direct send' },
        { status: 400 }
      );
  }

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, result });
}

// Handle create campaign
async function handleCreateCampaign(data: any, projectId: string) {
  const validation = createCampaignSchema.safeParse(data);
  if (!validation.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validation.error.issues },
      { status: 400 }
    );
  }

  const campaign = await prisma.emailCampaign.create({
    data: {
      projectId,
      ...validation.data,
      status: validation.data.scheduledAt ? 'SCHEDULED' : 'DRAFT',
    },
  });

  return NextResponse.json({ campaign });
}

// Handle send campaign
async function handleSendCampaign(data: any) {
  const { campaignId } = data;

  if (!campaignId) {
    return NextResponse.json({ error: 'Campaign ID required' }, { status: 400 });
  }

  const campaign = await prisma.emailCampaign.findUnique({
    where: { id: campaignId },
    include: { project: { include: { platforms: true } } },
  });

  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  // Find appropriate platform
  const platform = campaign.project.platforms.find(
    p => p.type === campaign.emailProvider
  );

  if (!platform) {
    return NextResponse.json(
      { error: `${campaign.emailProvider} platform not configured` },
      { status: 400 }
    );
  }

  // Send campaign
  let result;
  switch (campaign.emailProvider) {
    case 'RESEND': {
      const client = await createResendClientFromPlatform(platform.id);
      await client.sendCampaign(campaignId);
      result = { success: true };
      break;
    }
    default:
      return NextResponse.json(
        { error: 'Unsupported platform for campaign send' },
        { status: 400 }
      );
  }

  return NextResponse.json(result);
}
