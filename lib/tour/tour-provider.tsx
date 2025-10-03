"use client";

/**
 * Tour Provider Component
 * Client-side tour management using simple state
 */

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { dashboardTourSteps, tourConfig } from "./config";

interface TourContextValue {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  start: () => void;
  next: () => void;
  previous: () => void;
  skip: () => void;
  goToStep: (step: number) => void;
}

const TourContext = createContext<TourContextValue | null>(null);

export function TourProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const start = useCallback(() => {
    setIsActive(true);
    setCurrentStep(0);
  }, []);

  const next = useCallback(() => {
    if (currentStep < dashboardTourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsActive(false);
      setCurrentStep(0);
    }
  }, [currentStep]);

  const previous = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const skip = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
  }, []);

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < dashboardTourSteps.length) {
      setCurrentStep(step);
    }
  }, []);

  const value: TourContextValue = {
    isActive,
    currentStep,
    totalSteps: dashboardTourSteps.length,
    start,
    next,
    previous,
    skip,
    goToStep,
  };

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTour must be used within a TourProvider");
  }
  return context;
}
