"use client";

/**
 * Wizard Container Component
 * Main container for the onboarding wizard with stepper and navigation
 */

import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ChevronLeft, ChevronRight, SkipForward } from "lucide-react";
import { ONBOARDING_STEPS } from "@/lib/onboarding/types";
import { OnboardingState } from "@/lib/onboarding/state";
import type { OnboardingProgress } from "@/lib/onboarding/types";

interface WizardContainerProps {
  children: ReactNode;
  currentStep: number;
  progress: OnboardingProgress;
  onNext: () => void;
  onPrevious: () => void;
  onSkip?: () => void;
  isLoading?: boolean;
  nextDisabled?: boolean;
  nextLabel?: string;
}

export function WizardContainer({
  children,
  currentStep,
  progress,
  onNext,
  onPrevious,
  onSkip,
  isLoading = false,
  nextDisabled = false,
  nextLabel = "Continue",
}: WizardContainerProps) {
  const completionPercentage = OnboardingState.getCompletionPercentage(progress);
  const currentStepInfo = ONBOARDING_STEPS[currentStep - 1];
  const canProceed = OnboardingState.canProceedToNext(progress);
  const isLastStep = currentStep === 8;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Welcome to Full Self Publishing
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Let's get you set up in just a few minutes
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Step {currentStep} of 8
              </div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {completionPercentage}% Complete
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={completionPercentage} className="h-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {OnboardingState.getEstimatedTimeRemaining(progress)} remaining
            </p>
          </div>
        </div>

        {/* Stepper */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {ONBOARDING_STEPS.map((step, index) => {
              const isActive = step.id === currentStep;
              const isCompleted = OnboardingState.isStepCompleted(progress, step.id);
              const isAccessible = OnboardingState.isStepAccessible(progress, step.id);

              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`
                        w-10 h-10 rounded-full flex items-center justify-center
                        font-semibold text-sm transition-all duration-200
                        ${isCompleted
                          ? "bg-green-500 text-white"
                          : isActive
                            ? "bg-purple-600 text-white ring-4 ring-purple-200 dark:ring-purple-800"
                            : isAccessible
                              ? "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600"
                        }
                      `}
                    >
                      {isCompleted ? "✓" : step.id}
                    </div>
                    <div className="mt-2 text-center hidden md:block">
                      <div
                        className={`text-xs font-medium ${
                          isActive
                            ? "text-purple-600 dark:text-purple-400"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {step.title}
                      </div>
                    </div>
                  </div>
                  {index < ONBOARDING_STEPS.length - 1 && (
                    <div
                      className={`
                        w-8 md:w-16 h-1 mx-1 md:mx-2 rounded transition-all duration-200
                        ${isCompleted ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"}
                      `}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <Card className="max-w-4xl mx-auto">
          <div className="p-8">
            {/* Step Title */}
            <div className="mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentStepInfo?.title}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {currentStepInfo?.description}
              </p>
            </div>

            {/* Step Content */}
            <div className="min-h-[400px]">{children}</div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div>
                {currentStep > 1 && (
                  <Button
                    variant="outline"
                    onClick={onPrevious}
                    disabled={isLoading}
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-3">
                {currentStepInfo?.canSkip && onSkip && !isLastStep && (
                  <Button
                    variant="ghost"
                    onClick={onSkip}
                    disabled={isLoading}
                  >
                    <SkipForward className="w-4 h-4 mr-2" />
                    Skip for now
                  </Button>
                )}
                <Button
                  onClick={onNext}
                  disabled={isLoading || nextDisabled || (!canProceed && !isLastStep)}
                  size="lg"
                >
                  {isLoading ? (
                    "Processing..."
                  ) : isLastStep ? (
                    "Complete Setup"
                  ) : (
                    <>
                      {nextLabel}
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Help Text */}
        <div className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400">
          Need help? Contact us at support@fullselfpublishing.com
        </div>
      </div>
    </div>
  );
}
