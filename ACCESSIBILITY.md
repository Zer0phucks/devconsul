# Accessibility Guide

Full Self Publishing is committed to providing an accessible experience for all users. This document outlines our accessibility features, testing procedures, and compliance standards.

## WCAG 2.1 AA Compliance

We aim to meet WCAG 2.1 Level AA standards across the platform.

### Key Features

#### 1. Keyboard Navigation

All interactive elements are keyboard accessible:

- **Tab**: Navigate forward through interactive elements
- **Shift + Tab**: Navigate backward
- **Enter/Space**: Activate buttons and links
- **Escape**: Close modals and dialogs
- **Arrow keys**: Navigate within lists and menus

#### 2. Screen Reader Support

- Semantic HTML elements throughout
- ARIA labels on all interactive elements
- ARIA live regions for dynamic content updates
- Descriptive alt text for all images
- Skip to content link at page top

#### 3. Focus Management

- Visible focus indicators on all interactive elements (2px outline)
- Focus trap in modals and dialogs
- Logical tab order throughout pages
- No keyboard traps

#### 4. Color Contrast

All text meets WCAG AA contrast requirements:
- Normal text: 4.5:1 minimum
- Large text (18pt+): 3:1 minimum
- UI components and graphics: 3:1 minimum

#### 5. Responsive Design

- Mobile-first approach
- Touch-friendly controls (44x44px minimum)
- Responsive breakpoints: 640px, 768px, 1024px, 1280px, 1536px
- Fluid typography and spacing

## Keyboard Shortcuts

### Global Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/⌘ + K` | Open search |
| `Ctrl/⌘ + N` | Create new item |
| `Shift + ?` | Show keyboard shortcuts |
| `Ctrl/⌘ + D` | Go to dashboard |
| `Ctrl/⌘ + P` | Go to projects |
| `Ctrl/⌘ + A` | Go to analytics |

### Context Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/⌘ + S` | Save (in forms) |
| `Ctrl/⌘ + Z` | Undo |
| `Ctrl/⌘ + Shift + Z` | Redo |
| `Escape` | Close modal/dialog |

## Testing Procedures

### Automated Testing

1. **Lighthouse Accessibility Audit**
   ```bash
   # Run in Chrome DevTools
   # Target: Score of 90+
   ```

2. **axe DevTools**
   ```bash
   npm install -D @axe-core/react
   # Add to development environment
   ```

### Manual Testing

#### Screen Reader Testing

**NVDA (Windows - Free)**
```
1. Download from https://www.nvaccess.org/
2. Navigate site using only screen reader
3. Verify all content is announced correctly
4. Check ARIA labels and live regions
```

**VoiceOver (Mac - Built-in)**
```
1. Enable: Cmd + F5
2. Navigate: Cmd + L (rotor), VO + Right Arrow
3. Test all interactive elements
4. Verify image descriptions
```

**JAWS (Windows - Commercial)**
```
1. Most widely used enterprise screen reader
2. Test in production environments
3. Verify complex interactions
```

#### Keyboard Navigation Testing

**Complete keyboard flow test:**

1. Tab through entire page without mouse
2. Verify focus indicators visible on all elements
3. Test all interactive elements with Enter/Space
4. Verify modal focus trapping
5. Test Escape key functionality

#### Color Contrast Testing

**Tools:**
- Chrome DevTools Color Picker (shows contrast ratio)
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- Stark plugin for Figma/Sketch

**Process:**
1. Check all text/background combinations
2. Verify minimum 4.5:1 for normal text
3. Test in both light and dark modes
4. Check UI component states (hover, focus, active)

#### Responsive Testing

**Devices to test:**
- Mobile: iPhone SE, iPhone 14, Android phones
- Tablet: iPad, Android tablets
- Desktop: 1024px, 1280px, 1920px, 2560px

**Breakpoints:**
- Mobile: < 768px
- Tablet: 768px - 1023px
- Desktop: 1024px - 1279px
- Large Desktop: 1280px+

### Browser Testing

Test in:
- Chrome/Edge (Chromium)
- Firefox
- Safari
- Mobile Safari
- Chrome Mobile

## Implementation Utilities

### Focus Management

```typescript
import { createFocusTrap } from "@/lib/accessibility/focus-trap";

// In modal/dialog component
useEffect(() => {
  if (!isOpen) return;
  const cleanup = createFocusTrap(containerRef.current);
  return cleanup;
}, [isOpen]);
```

### ARIA Announcements

```typescript
import { announceToScreenReader } from "@/lib/accessibility/aria-utils";

// Announce dynamic updates
announceToScreenReader("New content loaded", "polite");
announceToScreenReader("Error occurred", "assertive");
```

### Keyboard Shortcuts

```typescript
import { useKeyboardShortcuts, commonShortcuts } from "@/lib/hooks/use-keyboard-shortcuts";

const shortcuts = [
  commonShortcuts.save(() => handleSave()),
  commonShortcuts.close(() => handleClose()),
];

useKeyboardShortcuts(shortcuts);
```

### Responsive Hooks

```typescript
import { useIsMobile, useIsTablet, useIsDesktop } from "@/lib/hooks/use-media-query";

const isMobile = useIsMobile();
const isTablet = useIsTablet();
const isDesktop = useIsDesktop();
```

## Common Accessibility Patterns

### Modal/Dialog

```tsx
<Dialog>
  <DialogContent
    role="dialog"
    aria-modal="true"
    aria-labelledby="dialog-title"
    aria-describedby="dialog-description"
  >
    <DialogHeader>
      <DialogTitle id="dialog-title">Title</DialogTitle>
      <DialogDescription id="dialog-description">
        Description
      </DialogDescription>
    </DialogHeader>
    {/* Focus trap applied automatically */}
  </DialogContent>
</Dialog>
```

### Form Fields

```tsx
<div>
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    aria-describedby="email-error"
    aria-invalid={hasError}
  />
  {hasError && (
    <p id="email-error" role="alert" className="text-destructive">
      Please enter a valid email
    </p>
  )}
</div>
```

### Loading States

```tsx
<div role="status" aria-label="Loading...">
  <Skeleton className="h-8 w-full" />
  <span className="sr-only">Loading content...</span>
</div>
```

### Empty States

```tsx
<EmptyState
  icon={FolderOpen}
  title="No projects yet"
  description="Get started by creating your first project"
  action={{
    label: "Create Project",
    onClick: handleCreate,
  }}
/>
```

## Accessibility Checklist

Before deploying:

- [ ] All images have alt text
- [ ] All form fields have labels
- [ ] All buttons have descriptive text/aria-labels
- [ ] Color contrast meets WCAG AA
- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible
- [ ] No keyboard traps
- [ ] Screen reader tested with NVDA/VoiceOver
- [ ] Lighthouse accessibility score > 90
- [ ] Skip to content link present
- [ ] Responsive on mobile, tablet, desktop
- [ ] Touch targets at least 44x44px
- [ ] Reduced motion preferences respected

## Resources

### Official Guidelines
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

### Tools
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Browser Extension](https://wave.webaim.org/extension/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)

### Screen Readers
- [NVDA](https://www.nvaccess.org/) - Free, Windows
- [JAWS](https://www.freedomscientific.com/products/software/jaws/) - Commercial, Windows
- [VoiceOver](https://www.apple.com/accessibility/voiceover/) - Built-in, macOS/iOS

## Support

For accessibility issues or questions:
- Create an issue in the repository
- Contact: accessibility@fullselfpublishing.com
- We aim to respond within 48 hours

## Continuous Improvement

We continuously work to improve accessibility:
- Regular audits with automated tools
- User testing with assistive technology users
- Stay updated with WCAG guidelines
- Monitor accessibility best practices

Last updated: 2025-10-02
