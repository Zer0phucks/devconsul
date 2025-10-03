"use client";

import { useEffect, useState } from "react";

/**
 * Custom hook for responsive media queries
 * @param query - Media query string (e.g., "(min-width: 768px)")
 * @returns boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);

    // Set initial value
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    // Create listener
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);

    // Add listener (using deprecated addListener for older browser support)
    if (media.addEventListener) {
      media.addEventListener("change", listener);
    } else {
      // @ts-ignore - fallback for older browsers
      media.addListener(listener);
    }

    return () => {
      if (media.removeEventListener) {
        media.removeEventListener("change", listener);
      } else {
        // @ts-ignore - fallback for older browsers
        media.removeListener(listener);
      }
    };
  }, [matches, query]);

  return matches;
}

/**
 * Predefined breakpoint hooks based on Tailwind CSS
 */
export const useIsMobile = () => useMediaQuery("(max-width: 767px)");
export const useIsTablet = () => useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
export const useIsDesktop = () => useMediaQuery("(min-width: 1024px)");
export const useIsLargeDesktop = () => useMediaQuery("(min-width: 1280px)");
export const useIsExtraLargeDesktop = () => useMediaQuery("(min-width: 1536px)");
