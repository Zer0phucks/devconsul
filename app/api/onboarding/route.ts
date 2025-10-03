/**
 * Onboarding API Routes
 * Handles onboarding progress CRUD operations
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/onboarding
 * Fetch current user's onboarding progress
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let progress = await prisma.onboardingProgress.findUnique({
      where: { userId: user.id },
    });

    // Create progress record if it doesn't exist
    if (!progress) {
      progress = await prisma.onboardingProgress.create({
        data: {
          userId: user.id,
          currentStep: 1,
          completedSteps: [],
          step1Completed: false,
          step2Completed: false,
          step3Completed: false,
          step4Completed: false,
          step5Completed: false,
          step6Completed: false,
          step7Completed: false,
          step8Completed: false,
        },
      });
    }

    return NextResponse.json(progress);
  } catch (error) {
    console.error("Error fetching onboarding progress:", error);
    return NextResponse.json(
      { error: "Failed to fetch onboarding progress" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/onboarding
 * Update onboarding progress
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { step, data, completed, skipped } = body;

    if (!step || step < 1 || step > 8) {
      return NextResponse.json({ error: "Invalid step number" }, { status: 400 });
    }

    // Get current progress
    let progress = await prisma.onboardingProgress.findUnique({
      where: { userId: user.id },
    });

    if (!progress) {
      progress = await prisma.onboardingProgress.create({
        data: {
          userId: user.id,
          currentStep: 1,
          completedSteps: [],
        },
      });
    }

    // Build update data
    const updateData: any = {
      lastActiveStep: step,
      lastActiveAt: new Date(),
    };

    // Update step-specific data
    if (data !== undefined) {
      updateData[`step${step}Data`] = data;
    }

    // Mark step as completed
    if (completed) {
      updateData[`step${step}Completed`] = true;

      // Add to completed steps if not already there
      const completedSteps = [...new Set([...progress.completedSteps, step])];
      updateData.completedSteps = completedSteps;

      // Move to next step if not on last step
      if (step < 8) {
        updateData.currentStep = step + 1;
      } else {
        // Last step completed - mark entire onboarding as complete
        updateData.isCompleted = true;
        updateData.completedAt = new Date();
      }
    }

    // Handle skip
    if (skipped) {
      const skippedSteps = [...new Set([...progress.skippedSteps, step])];
      updateData.skippedSteps = skippedSteps;

      // Move to next step
      if (step < 8) {
        updateData.currentStep = step + 1;
      }
    }

    // Update progress
    const updatedProgress = await prisma.onboardingProgress.update({
      where: { userId: user.id },
      data: updateData,
    });

    return NextResponse.json(updatedProgress);
  } catch (error) {
    console.error("Error updating onboarding progress:", error);
    return NextResponse.json(
      { error: "Failed to update onboarding progress" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/onboarding
 * Update tour progress
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { tourStarted, tourCompleted, tourSkipped, tourProgress } = body;

    const updateData: any = {};

    if (tourStarted !== undefined) {
      updateData.tourStartedAt = tourStarted ? new Date() : null;
    }

    if (tourCompleted !== undefined) {
      updateData.tourCompleted = tourCompleted;
      updateData.tourCompletedAt = tourCompleted ? new Date() : null;
    }

    if (tourSkipped !== undefined) {
      updateData.tourSkippedAt = tourSkipped ? new Date() : null;
    }

    if (tourProgress !== undefined) {
      updateData.tourProgress = tourProgress;
    }

    const updatedProgress = await prisma.onboardingProgress.update({
      where: { userId: user.id },
      data: updateData,
    });

    return NextResponse.json(updatedProgress);
  } catch (error) {
    console.error("Error updating tour progress:", error);
    return NextResponse.json(
      { error: "Failed to update tour progress" },
      { status: 500 }
    );
  }
}
