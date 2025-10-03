"use client";

/**
 * Onboarding Wizard Page
 * Main entry point for new user onboarding
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { WizardContainer } from "@/components/onboarding/wizard-container";
import { Step1Welcome } from "@/components/onboarding/steps/step-1-welcome";
import { Step2GitHub } from "@/components/onboarding/steps/step-2-github";
import { Step3ContentTypes } from "@/components/onboarding/steps/step-3-content-types";
import { Step4BrandVoice } from "@/components/onboarding/steps/step-4-brand-voice";
import { Step5Platforms } from "@/components/onboarding/steps/step-5-platforms";
import { Step6TestContent } from "@/components/onboarding/steps/step-6-test-content";
import { Step7Review } from "@/components/onboarding/steps/step-7-review";
import { Step8Complete } from "@/components/onboarding/steps/step-8-complete";
import { OnboardingProgress } from "@/lib/onboarding/types";
import { OnboardingState } from "@/lib/onboarding/state";

export default function OnboardingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/onboarding");
    }
  }, [status, router]);

  // Fetch onboarding progress
  useEffect(() => {
    if (status === "authenticated") {
      fetchProgress();
    }
  }, [status]);

  const fetchProgress = async () => {
    try {
      const response = await fetch("/api/onboarding");
      if (response.ok) {
        const data = await response.json();
        setProgress(data);
      }
    } catch (error) {
      console.error("Error fetching progress:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (step: number, data: any, completed: boolean, skipped = false) => {
    setSaving(true);
    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step, data, completed, skipped }),
      });

      if (response.ok) {
        const updatedProgress = await response.json();
        setProgress(updatedProgress);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error updating progress:", error);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    if (!progress) return;

    const currentStep = progress.currentStep;
    const isCompleted = OnboardingState.isStepCompleted(progress, currentStep);

    if (isCompleted) {
      // Move to next step
      if (currentStep < 8) {
        await updateProgress(currentStep, null, false, false);
      } else {
        // Complete onboarding
        router.push("/dashboard");
      }
    }
  };

  const handlePrevious = async () => {
    if (!progress || progress.currentStep <= 1) return;

    const previousStep = OnboardingState.getPreviousStep(progress);
    await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        step: previousStep,
        data: null,
        completed: false,
        skipped: false,
      }),
    });

    await fetchProgress();
  };

  const handleSkip = async () => {
    if (!progress) return;
    await updateProgress(progress.currentStep, null, false, true);
  };

  const handleStepComplete = async (stepNumber: number, data: any) => {
    await updateProgress(stepNumber, data, true, false);
  };

  const handleStartTour = async () => {
    await fetch("/api/onboarding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tourStarted: true }),
    });
    router.push("/dashboard?tour=start");
  };

  const handleGoToDashboard = () => {
    router.push("/dashboard");
  };

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading onboarding...</p>
        </div>
      </div>
    );
  }

  if (!progress) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Failed to load onboarding progress</p>
        </div>
      </div>
    );
  }

  // Redirect if already completed
  if (progress.isCompleted) {
    router.push("/dashboard");
    return null;
  }

  const currentStep = progress.currentStep;

  return (
    <WizardContainer
      currentStep={currentStep}
      progress={progress}
      onNext={handleNext}
      onPrevious={handlePrevious}
      onSkip={handleSkip}
      isLoading={saving}
      nextDisabled={!OnboardingState.canProceedToNext(progress)}
    >
      {currentStep === 1 && (
        <Step1Welcome onComplete={(data) => handleStepComplete(1, data)} />
      )}
      {currentStep === 2 && (
        <Step2GitHub onComplete={(data) => handleStepComplete(2, data)} />
      )}
      {currentStep === 3 && (
        <Step3ContentTypes onComplete={(data) => handleStepComplete(3, data)} />
      )}
      {currentStep === 4 && (
        <Step4BrandVoice onComplete={(data) => handleStepComplete(4, data)} />
      )}
      {currentStep === 5 && (
        <Step5Platforms onComplete={(data) => handleStepComplete(5, data)} />
      )}
      {currentStep === 6 && (
        <Step6TestContent onComplete={(data) => handleStepComplete(6, data)} />
      )}
      {currentStep === 7 && (
        <Step7Review onComplete={(data) => handleStepComplete(7, data)} />
      )}
      {currentStep === 8 && (
        <Step8Complete
          onStartTour={handleStartTour}
          onGoToDashboard={handleGoToDashboard}
        />
      )}
    </WizardContainer>
  );
}
