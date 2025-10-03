import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "@/lib/auth"
import { authOptions } from "@/lib/auth"
import { db as prisma } from "@/lib/db"
import { contentSettingsSchema, defaultSettings } from "@/lib/validations/settings"
import { z } from "zod"

// GET /api/projects/[id]/settings - Fetch project settings
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await params
    const projectId = resolvedParams.id

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        user: { email: session.user.email },
      },
      include: {
        platforms: true,
      },
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Fetch or create settings
    let settings = await prisma.settings.findFirst({
      where: {
        projectId,
        scope: "PROJECT",
      },
    })

    if (!settings) {
      // Create default settings if they don't exist
      settings = await prisma.settings.create({
        data: {
          userId: project.userId,
          projectId: project.id,
          scope: "PROJECT",
          contentPreferences: defaultSettings.brandVoice,
          cronFrequency: defaultSettings.schedule.frequency,
          timezone: defaultSettings.schedule.timezone,
          publishingSchedule: { time: defaultSettings.schedule.time },
          contentFilters: defaultSettings.activityFilters,
          customSettings: {
            platforms: defaultSettings.platforms,
          },
        },
      })
    }

    // Transform database settings to API format
    const platformsConfig = (settings.customSettings as any)?.platforms || defaultSettings.platforms

    // Merge with actual platform connection status
    const platformsWithStatus = platformsConfig.map((platformConfig: any) => {
      const connectedPlatform = project.platforms.find(
        (p) => p.type === platformConfig.type
      )
      return {
        ...platformConfig,
        isConnected: connectedPlatform?.isConnected || false,
      }
    })

    const response = {
      platforms: platformsWithStatus,
      schedule: {
        frequency: settings.cronFrequency || defaultSettings.schedule.frequency,
        time: (settings.publishingSchedule as any)?.time || defaultSettings.schedule.time,
        timezone: settings.timezone || defaultSettings.schedule.timezone,
      },
      brandVoice: {
        ...(settings.contentPreferences as any),
        ...defaultSettings.brandVoice,
        ...(settings.contentPreferences || {}),
      },
      activityFilters: {
        ...(settings.contentFilters as any),
        ...defaultSettings.activityFilters,
        ...(settings.contentFilters || {}),
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching settings:", error)
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    )
  }
}

// PUT /api/projects/[id]/settings - Update project settings
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const resolvedParams = await params
    const projectId = resolvedParams.id

    // Verify project ownership
    const project = await prisma.project.findFirst({
      where: {
        id: projectId,
        user: { email: session.user.email },
      },
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = contentSettingsSchema.parse(body)

    // Update or create settings
    const settings = await prisma.settings.upsert({
      where: {
        userId_projectId_scope: {
          userId: project.userId,
          projectId: project.id,
          scope: "PROJECT",
        },
      },
      update: {
        contentPreferences: validatedData.brandVoice,
        cronFrequency: validatedData.schedule.frequency,
        timezone: validatedData.schedule.timezone,
        publishingSchedule: { time: validatedData.schedule.time },
        contentFilters: validatedData.activityFilters,
        customSettings: {
          platforms: validatedData.platforms,
        },
        updatedAt: new Date(),
      },
      create: {
        userId: project.userId,
        projectId: project.id,
        scope: "PROJECT",
        contentPreferences: validatedData.brandVoice,
        cronFrequency: validatedData.schedule.frequency,
        timezone: validatedData.schedule.timezone,
        publishingSchedule: { time: validatedData.schedule.time },
        contentFilters: validatedData.activityFilters,
        customSettings: {
          platforms: validatedData.platforms,
        },
      },
    })

    return NextResponse.json({ success: true, settings })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid settings data", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error updating settings:", error)
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    )
  }
}
