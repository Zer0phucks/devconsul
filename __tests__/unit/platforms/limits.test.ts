import { describe, it, expect } from '@jest/globals';
import {
  enforceLimit,
  splitForThreading,
  validateLength,
  getRemainingChars,
  getLimitPercentage,
  PLATFORM_LIMITS,
} from '@/lib/platforms/limits';

describe('Platform Character Limits', () => {
  describe('enforceLimit', () => {
    it('should allow content within Twitter limit', () => {
      const text = 'This is a short tweet';
      const result = enforceLimit(text, 'twitter');

      expect(result.truncated).toBe(false);
      expect(result.text).toBe(text);
      expect(result.exceedsLimit).toBe(false);
    });

    it('should warn when approaching Twitter limit', () => {
      const text = 'a'.repeat(275);
      const result = enforceLimit(text, 'twitter');

      expect(result.truncated).toBe(false);
      expect(result.warning).toContain('approaching');
      expect(result.exceedsLimit).toBe(false);
    });

    it('should truncate content exceeding Twitter limit', () => {
      const text = 'a'.repeat(300);
      const result = enforceLimit(text, 'twitter', { forceTruncate: true });

      expect(result.truncated).toBe(true);
      expect(result.text).toHaveLength(280);
      expect(result.text).toMatch(/…$/);
      expect(result.exceedsLimit).toBe(false);
    });

    it('should preserve word boundaries when truncating', () => {
      const text = 'a'.repeat(250) + ' word boundary test ' + 'b'.repeat(50);
      const result = enforceLimit(text, 'twitter', { forceTruncate: true });

      expect(result.truncated).toBe(true);
      expect(result.text).toMatch(/…$/);
      // Should truncate at space, not mid-word
      expect(result.text).not.toMatch(/\S…$/);
    });

    it('should use custom truncation suffix', () => {
      const text = 'a'.repeat(300);
      const result = enforceLimit(text, 'twitter', {
        forceTruncate: true,
        customSuffix: '...',
      });

      expect(result.text).toMatch(/\.\.\.$/);
    });

    it('should not truncate without forceTruncate flag', () => {
      const text = 'a'.repeat(300);
      const result = enforceLimit(text, 'twitter');

      expect(result.truncated).toBe(false);
      expect(result.exceedsLimit).toBe(true);
      expect(result.warning).toContain('exceeds');
    });
  });

  describe('Platform-specific limits', () => {
    it('should enforce LinkedIn character limit (3000)', () => {
      const text = 'a'.repeat(3500);
      const result = enforceLimit(text, 'linkedin', { forceTruncate: true });

      expect(result.text.length).toBeLessThanOrEqual(3000);
      expect(result.truncated).toBe(true);
    });

    it('should enforce Facebook character limit (63206)', () => {
      const text = 'a'.repeat(70000);
      const result = enforceLimit(text, 'facebook', { forceTruncate: true });

      expect(result.text.length).toBeLessThanOrEqual(63206);
      expect(result.truncated).toBe(true);
    });

    it('should enforce Reddit character limit (40000)', () => {
      const text = 'a'.repeat(50000);
      const result = enforceLimit(text, 'reddit', { forceTruncate: true });

      expect(result.text.length).toBeLessThanOrEqual(40000);
      expect(result.truncated).toBe(true);
    });

    it('should enforce Reddit title limit (300)', () => {
      const title = 'a'.repeat(350);
      const result = enforceLimit(title, 'redditTitle', { forceTruncate: true });

      expect(result.text.length).toBeLessThanOrEqual(300);
      expect(result.truncated).toBe(true);
    });

    it('should enforce LinkedIn Article limit (110000)', () => {
      const text = 'a'.repeat(120000);
      const result = enforceLimit(text, 'linkedinArticle', { forceTruncate: true });

      expect(result.text.length).toBeLessThanOrEqual(110000);
      expect(result.truncated).toBe(true);
    });
  });

  describe('splitForThreading', () => {
    it('should not split content within limit', () => {
      const text = 'Short content';
      const parts = splitForThreading(text, 'twitter');

      expect(parts).toHaveLength(1);
      expect(parts[0]).toBe(text);
    });

    it('should split long content into multiple parts', () => {
      const text = 'a'.repeat(600);
      const parts = splitForThreading(text, 'twitter');

      expect(parts.length).toBeGreaterThan(1);
      parts.forEach((part) => {
        expect(part.length).toBeLessThanOrEqual(280);
      });
    });

    it('should add thread indicators', () => {
      const text = 'a'.repeat(600);
      const parts = splitForThreading(text, 'twitter', { threadIndicator: true });

      expect(parts.length).toBeGreaterThan(1);
      expect(parts[0]).toMatch(/1\/\d+$/);
      expect(parts[parts.length - 1]).toMatch(new RegExp(`${parts.length}/${parts.length}$`));
    });

    it('should preserve paragraphs when splitting', () => {
      const text = 'Paragraph 1\n\n' + 'a'.repeat(250) + '\n\nParagraph 2\n\n' + 'b'.repeat(250);
      const parts = splitForThreading(text, 'twitter', { preserveParagraphs: true });

      expect(parts.length).toBeGreaterThan(1);
      // Each part should not mix paragraphs
      parts.forEach((part) => {
        const paragraphCount = (part.match(/\n\n/g) || []).length;
        expect(paragraphCount).toBeLessThanOrEqual(2);
      });
    });

    it('should split long paragraph by sentences', () => {
      const text =
        'This is sentence one. '.repeat(20) +
        'This is sentence two. '.repeat(20) +
        'This is sentence three. '.repeat(20);
      const parts = splitForThreading(text, 'twitter', { preserveParagraphs: true });

      expect(parts.length).toBeGreaterThan(1);
      parts.forEach((part) => {
        expect(part.length).toBeLessThanOrEqual(280);
      });
    });

    it('should preserve word boundaries when splitting', () => {
      const text = 'word '.repeat(100);
      const parts = splitForThreading(text, 'twitter');

      parts.forEach((part) => {
        expect(part).not.toMatch(/\Sword$/);
        expect(part.trim()).not.toBe('');
      });
    });
  });

  describe('validateLength', () => {
    it('should validate content within limit', () => {
      const text = 'Valid content';
      const result = validateLength(text, 'twitter');

      expect(result.valid).toBe(true);
      expect(result.length).toBe(text.length);
      expect(result.limit).toBe(280);
      expect(result.warning).toBeUndefined();
    });

    it('should warn when approaching limit', () => {
      const text = 'a'.repeat(275);
      const result = validateLength(text, 'twitter');

      expect(result.valid).toBe(true);
      expect(result.warning).toContain('Approaching limit');
    });

    it('should invalidate content exceeding limit', () => {
      const text = 'a'.repeat(300);
      const result = validateLength(text, 'twitter');

      expect(result.valid).toBe(false);
      expect(result.warning).toContain('Exceeds limit');
    });
  });

  describe('getRemainingChars', () => {
    it('should calculate remaining characters', () => {
      const text = 'Test content';
      const remaining = getRemainingChars(text, 'twitter');

      expect(remaining).toBe(280 - text.length);
    });

    it('should return 0 when limit exceeded', () => {
      const text = 'a'.repeat(300);
      const remaining = getRemainingChars(text, 'twitter');

      expect(remaining).toBe(0);
    });
  });

  describe('getLimitPercentage', () => {
    it('should calculate percentage of limit used', () => {
      const text = 'a'.repeat(140); // 50% of Twitter limit
      const percentage = getLimitPercentage(text, 'twitter');

      expect(percentage).toBe(50);
    });

    it('should cap at 100% when exceeded', () => {
      const text = 'a'.repeat(350);
      const percentage = getLimitPercentage(text, 'twitter');

      expect(percentage).toBe(100);
    });

    it('should calculate correctly for LinkedIn', () => {
      const text = 'a'.repeat(1500); // 50% of LinkedIn limit
      const percentage = getLimitPercentage(text, 'linkedin');

      expect(percentage).toBe(50);
    });
  });

  describe('Error handling', () => {
    it('should throw error for unknown platform', () => {
      expect(() => {
        enforceLimit('test', 'unknown' as any);
      }).toThrow(/Unknown platform/);
    });

    it('should throw error for unknown platform in splitForThreading', () => {
      expect(() => {
        splitForThreading('test', 'unknown' as any);
      }).toThrow(/Unknown platform/);
    });
  });

  describe('Platform limits constants', () => {
    it('should have correct Twitter limits', () => {
      expect(PLATFORM_LIMITS.twitter).toEqual({
        name: 'Twitter/X',
        characterLimit: 280,
        recommendedLimit: 270,
        truncationSuffix: '…',
        preserveWordBoundary: true,
      });
    });

    it('should have correct LinkedIn limits', () => {
      expect(PLATFORM_LIMITS.linkedin).toEqual({
        name: 'LinkedIn',
        characterLimit: 3000,
        recommendedLimit: 2900,
        truncationSuffix: '…',
        preserveWordBoundary: true,
      });
    });

    it('should have limits for all supported platforms', () => {
      const expectedPlatforms = [
        'twitter',
        'linkedin',
        'linkedinArticle',
        'facebook',
        'reddit',
        'redditTitle',
      ];

      expectedPlatforms.forEach((platform) => {
        expect(PLATFORM_LIMITS[platform]).toBeDefined();
        expect(PLATFORM_LIMITS[platform].characterLimit).toBeGreaterThan(0);
      });
    });
  });
});
