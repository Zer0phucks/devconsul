"use client";

import { useMediaQuery } from "./use-media-query";

export type Breakpoint = "sm" | "md" | "lg" | "xl" | "2xl";

const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};

/**
 * Get the current active breakpoint
 * @returns The current breakpoint name
 */
export function useBreakpoint(): Breakpoint {
  const is2xl = useMediaQuery(`(min-width: ${breakpoints["2xl"]}px)`);
  const isXl = useMediaQuery(`(min-width: ${breakpoints.xl}px)`);
  const isLg = useMediaQuery(`(min-width: ${breakpoints.lg}px)`);
  const isMd = useMediaQuery(`(min-width: ${breakpoints.md}px)`);
  const isSm = useMediaQuery(`(min-width: ${breakpoints.sm}px)`);

  if (is2xl) return "2xl";
  if (isXl) return "xl";
  if (isLg) return "lg";
  if (isMd) return "md";
  if (isSm) return "sm";
  return "sm"; // Default to smallest
}

/**
 * Check if current viewport is at or above a breakpoint
 * @param breakpoint - The breakpoint to check against
 * @returns boolean
 */
export function useBreakpointValue(breakpoint: Breakpoint): boolean {
  return useMediaQuery(`(min-width: ${breakpoints[breakpoint]}px)`);
}
