/**
 * Onboarding Type Definitions
 * Central types for the onboarding wizard system
 */

export interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  optional?: boolean;
  canSkip?: boolean;
}

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: "Welcome",
    description: "Introduction to Full Self Publishing",
    canSkip: false,
  },
  {
    id: 2,
    title: "Connect GitHub",
    description: "Link your repository",
    optional: true,
    canSkip: true,
  },
  {
    id: 3,
    title: "Content Types",
    description: "Choose what you want to publish",
    canSkip: false,
  },
  {
    id: 4,
    title: "Brand Voice",
    description: "Define your unique voice",
    canSkip: false,
  },
  {
    id: 5,
    title: "Connect Platforms",
    description: "Link 1-2 publishing platforms",
    optional: true,
    canSkip: true,
  },
  {
    id: 6,
    title: "Test Content",
    description: "Generate sample content",
    canSkip: true,
  },
  {
    id: 7,
    title: "Review & Customize",
    description: "Finalize your settings",
    canSkip: false,
  },
  {
    id: 8,
    title: "Complete",
    description: "Setup finished",
    canSkip: false,
  },
];

export interface OnboardingStepData {
  step1?: {
    videoWatched?: boolean;
    startedAt: string;
  };
  step2?: {
    repoId?: string;
    repoName?: string;
    repoOwner?: string;
    skipped: boolean;
  };
  step3?: {
    selectedTypes: string[];
  };
  step4?: {
    tone: string;
    audience: string;
    themes: string;
    generatedVoice?: string;
  };
  step5?: {
    platforms: Array<{
      type: string;
      connected: boolean;
    }>;
    skipped: boolean;
  };
  step6?: {
    contentId?: string;
    accepted: boolean;
    regenerated?: number;
  };
  step7?: {
    cronSchedule?: string;
    frequency?: string;
    timezone?: string;
  };
  step8?: {
    tourStarted: boolean;
    completedAt: string;
  };
}

export interface OnboardingProgress {
  id: string;
  userId: string;
  currentStep: number;
  completedSteps: number[];
  isCompleted: boolean;
  completedAt?: Date;
  step1Completed: boolean;
  step2Completed: boolean;
  step3Completed: boolean;
  step4Completed: boolean;
  step5Completed: boolean;
  step6Completed: boolean;
  step7Completed: boolean;
  step8Completed: boolean;
  step1Data?: unknown;
  step2Data?: unknown;
  step3Data?: unknown;
  step4Data?: unknown;
  step5Data?: unknown;
  step6Data?: unknown;
  step7Data?: unknown;
  step8Data?: unknown;
  lastActiveStep: number;
  lastActiveAt: Date;
  canResume: boolean;
  skippedSteps: number[];
  tourCompleted: boolean;
  tourStartedAt?: Date;
  tourCompletedAt?: Date;
  tourSkippedAt?: Date;
  tourProgress?: unknown;
  metadata?: unknown;
}

export interface TourStep {
  element: string;
  popover: {
    title: string;
    description: string;
    side?: "top" | "right" | "bottom" | "left";
    align?: "start" | "center" | "end";
  };
}

export interface TourConfig {
  steps: TourStep[];
  showProgress: boolean;
  allowClose: boolean;
  overlayClickDismiss: boolean;
}
