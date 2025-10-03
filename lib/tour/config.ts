/**
 * Interactive Tour Configuration
 * Dashboard feature tour steps and configuration
 */

export interface TourStep {
  element: string;
  title: string;
  description: string;
  position?: "top" | "right" | "bottom" | "left";
}

export const dashboardTourSteps: TourStep[] = [
  {
    element: "#project-selector",
    title: "Projects",
    description: "Switch between your different projects. Each project can have its own GitHub repository, platforms, and settings.",
    position: "bottom",
  },
  {
    element: "#content-list",
    title: "Content Library",
    description: "View all your generated and published content. Click on any item to edit, regenerate, or publish to additional platforms.",
    position: "right",
  },
  {
    element: "#generate-content-btn",
    title: "Generate Content",
    description: "Manually trigger content generation from your latest GitHub activity. The AI will analyze your commits, PRs, and releases.",
    position: "left",
  },
  {
    element: "#platforms-section",
    title: "Connected Platforms",
    description: "Manage your connected publishing platforms. Add new platforms or reconnect existing ones if needed.",
    position: "top",
  },
  {
    element: "#scheduling-section",
    title: "Publishing Schedule",
    description: "View upcoming scheduled posts and configure your automated publishing frequency.",
    position: "left",
  },
  {
    element: "#analytics-card",
    title: "Analytics Overview",
    description: "Track your content performance, engagement metrics, and publishing statistics across all platforms.",
    position: "top",
  },
  {
    element: "#settings-link",
    title: "Project Settings",
    description: "Customize your brand voice, content preferences, cron schedules, and platform configurations.",
    position: "left",
  },
];

export const tourConfig = {
  showProgress: true,
  allowClose: true,
  overlayClickDismiss: false,
  keyboardControl: true,
  disableActiveInteraction: true,
};

/**
 * Get tour step by index
 */
export function getTourStep(index: number): TourStep | null {
  return dashboardTourSteps[index] || null;
}

/**
 * Get total tour steps
 */
export function getTotalTourSteps(): number {
  return dashboardTourSteps.length;
}

/**
 * Check if tour should auto-start
 */
export function shouldAutoStartTour(searchParams: URLSearchParams): boolean {
  return searchParams.get("tour") === "start";
}
