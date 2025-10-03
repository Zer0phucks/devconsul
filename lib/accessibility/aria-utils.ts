/**
 * ARIA utility functions for improved accessibility
 */

/**
 * Announce a message to screen readers
 * @param message - The message to announce
 * @param priority - 'polite' (default) or 'assertive'
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
) {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;

  document.body.appendChild(announcement);

  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

/**
 * Generate unique ID for ARIA relationships
 */
let idCounter = 0;
export function generateAriaId(prefix = 'aria'): string {
  idCounter += 1;
  return `${prefix}-${idCounter}-${Date.now()}`;
}

/**
 * Check if element has sufficient color contrast (WCAG AA)
 * @param foreground - Foreground color (hex)
 * @param background - Background color (hex)
 * @returns boolean indicating if contrast ratio meets WCAG AA (4.5:1)
 */
export function hasAccessibleContrast(
  foreground: string,
  background: string
): boolean {
  const ratio = getContrastRatio(foreground, background);
  return ratio >= 4.5;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(foreground: string, background: string): number {
  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);

  if (!fg || !bg) return 0;

  const l1 = getLuminance(fg.r, fg.g, fg.b);
  const l2 = getLuminance(bg.r, bg.g, bg.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Keyboard navigation helpers
 */
export const KeyboardKeys = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
} as const;

/**
 * Check if event is an activation key (Enter or Space)
 */
export function isActivationKey(event: React.KeyboardEvent | KeyboardEvent): boolean {
  return event.key === KeyboardKeys.ENTER || event.key === KeyboardKeys.SPACE;
}

/**
 * Make an element keyboard accessible
 * Adds role, tabindex, and keyboard event handlers
 */
export function makeKeyboardAccessible(
  element: HTMLElement,
  onClick: () => void,
  role: string = 'button'
) {
  element.setAttribute('role', role);
  element.setAttribute('tabindex', '0');

  const handleKeyDown = (event: KeyboardEvent) => {
    if (isActivationKey(event)) {
      event.preventDefault();
      onClick();
    }
  };

  element.addEventListener('keydown', handleKeyDown);

  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
}
