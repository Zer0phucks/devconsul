/**
 * Onboarding State Management
 * Utilities for managing wizard state and progress
 */

import { OnboardingProgress, OnboardingStepData } from "./types";

export class OnboardingState {
  /**
   * Calculate completion percentage
   */
  static getCompletionPercentage(progress: OnboardingProgress): number {
    const totalSteps = 8;
    const completed = progress.completedSteps.length;
    return Math.round((completed / totalSteps) * 100);
  }

  /**
   * Check if a step is completed
   */
  static isStepCompleted(progress: OnboardingProgress, step: number): boolean {
    return progress.completedSteps.includes(step);
  }

  /**
   * Check if a step is accessible
   */
  static isStepAccessible(progress: OnboardingProgress, step: number): boolean {
    // Step 1 is always accessible
    if (step === 1) return true;

    // Can access current step or next step if previous is completed
    if (step === progress.currentStep) return true;
    if (step === progress.currentStep + 1 && progress.completedSteps.includes(progress.currentStep)) {
      return true;
    }

    // Can access any previously completed step
    return progress.completedSteps.includes(step);
  }

  /**
   * Get next step number
   */
  static getNextStep(progress: OnboardingProgress): number {
    if (progress.isCompleted) return 8;
    return progress.currentStep < 8 ? progress.currentStep + 1 : 8;
  }

  /**
   * Get previous step number
   */
  static getPreviousStep(progress: OnboardingProgress): number {
    return progress.currentStep > 1 ? progress.currentStep - 1 : 1;
  }

  /**
   * Check if user can proceed to next step
   */
  static canProceedToNext(progress: OnboardingProgress): boolean {
    return progress.completedSteps.includes(progress.currentStep);
  }

  /**
   * Get step data
   */
  static getStepData(progress: OnboardingProgress, step: number): OnboardingStepData | null {
    const dataKey = `step${step}Data` as keyof OnboardingProgress;
    return (progress[dataKey] as OnboardingStepData) || null;
  }

  /**
   * Check if step is skipped
   */
  static isStepSkipped(progress: OnboardingProgress, step: number): boolean {
    return progress.skippedSteps.includes(step);
  }

  /**
   * Get welcome back message based on progress
   */
  static getWelcomeBackMessage(progress: OnboardingProgress): string {
    const percentage = this.getCompletionPercentage(progress);
    const currentStep = progress.currentStep;

    if (percentage === 0) {
      return "Let's get started with your setup!";
    } else if (percentage < 25) {
      return "Welcome back! Let's continue setting up your account.";
    } else if (percentage < 50) {
      return "You're making great progress! Let's keep going.";
    } else if (percentage < 75) {
      return "Almost there! Just a few more steps.";
    } else if (percentage < 100) {
      return "You're so close to finishing! Let's complete your setup.";
    } else {
      return "Your setup is complete! Time to explore the platform.";
    }
  }

  /**
   * Validate step data before saving
   */
  static validateStepData(step: number, data: unknown): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    switch (step) {
      case 3: {
        const step3Data = data as OnboardingStepData["step3"];
        if (!step3Data?.selectedTypes || step3Data.selectedTypes.length === 0) {
          errors.push("Please select at least one content type");
        }
        break;
      }
      case 4: {
        const step4Data = data as OnboardingStepData["step4"];
        if (!step4Data?.tone) errors.push("Please select a tone");
        if (!step4Data?.audience) errors.push("Please describe your target audience");
        if (!step4Data?.themes) errors.push("Please describe your key themes");
        break;
      }
      case 7: {
        const step7Data = data as OnboardingStepData["step7"];
        if (!step7Data?.frequency) errors.push("Please select a publishing frequency");
        break;
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get estimated time remaining
   */
  static getEstimatedTimeRemaining(progress: OnboardingProgress): string {
    const completedSteps = progress.completedSteps.length;
    const remainingSteps = 8 - completedSteps;

    // Assume 2 minutes per step on average
    const minutesRemaining = remainingSteps * 2;

    if (minutesRemaining === 0) return "Complete";
    if (minutesRemaining < 3) return "Less than 3 minutes";
    if (minutesRemaining < 10) return `About ${minutesRemaining} minutes`;
    return "About 10-15 minutes";
  }

  /**
   * Check if onboarding should be required
   */
  static shouldShowOnboarding(progress: OnboardingProgress | null): boolean {
    if (!progress) return true;
    if (progress.isCompleted) return false;
    // Show if less than 50% complete and last activity was more than 1 day ago
    const daysSinceLastActive = Math.floor(
      (Date.now() - new Date(progress.lastActiveAt).getTime()) / (1000 * 60 * 60 * 24)
    );
    const completionPercentage = this.getCompletionPercentage(progress);
    return completionPercentage < 50 && daysSinceLastActive < 7;
  }
}

/**
 * Default step data values
 */
export const DEFAULT_STEP_DATA: Partial<OnboardingStepData> = {
  step2: {
    skipped: false,
  },
  step3: {
    selectedTypes: [],
  },
  step4: {
    tone: "",
    audience: "",
    themes: "",
  },
  step5: {
    platforms: [],
    skipped: false,
  },
  step6: {
    accepted: false,
  },
  step7: {
    frequency: "weekly",
    timezone: "UTC",
  },
  step8: {
    tourStarted: false,
    completedAt: new Date().toISOString(),
  },
};
