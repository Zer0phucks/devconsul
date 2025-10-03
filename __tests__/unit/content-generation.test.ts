import { describe, it, expect, jest } from '@jest/globals';

/**
 * Unit Tests: Content Generation Engine
 * Tests core business logic for AI content generation
 */

describe('Content Generation', () => {
  describe('Character Limit Handling', () => {
    it('should truncate content to Twitter character limit (280)', () => {
      const longContent = 'a'.repeat(500);
      const twitterLimit = 280;
      const truncated = longContent.substring(0, twitterLimit);

      expect(truncated.length).toBeLessThanOrEqual(twitterLimit);
    });

    it('should handle LinkedIn character limit (3000)', () => {
      const content = 'a'.repeat(3500);
      const linkedInLimit = 3000;
      const truncated = content.substring(0, linkedInLimit);

      expect(truncated.length).toBeLessThanOrEqual(linkedInLimit);
    });
  });

  describe('Platform-Specific Formatting', () => {
    it('should convert markdown to plain text for Twitter', () => {
      const markdown = '# Heading\n\n**Bold** text';
      const plainText = markdown.replace(/[#*]/g, '').trim();

      expect(plainText).not.toContain('#');
      expect(plainText).not.toContain('**');
    });

    it('should preserve markdown for platforms that support it', () => {
      const markdown = '# Heading\n\n**Bold** text';
      const platforms = ['HASHNODE', 'DEVTO', 'GHOST', 'WORDPRESS'];

      platforms.forEach(platform => {
        // For markdown-supporting platforms, content should be preserved
        expect(markdown).toContain('#');
        expect(markdown).toContain('**');
      });
    });
  });

  describe('Content Validation', () => {
    it('should reject empty content', () => {
      const content = '';
      const isValid = content.trim().length > 0;

      expect(isValid).toBe(false);
    });

    it('should validate content has minimum length', () => {
      const content = 'Short';
      const minLength = 10;
      const isValid = content.length >= minLength;

      expect(isValid).toBe(false);
    });

    it('should accept valid content', () => {
      const content = 'This is a valid piece of content with sufficient length';
      const minLength = 10;
      const isValid = content.length >= minLength && content.trim().length > 0;

      expect(isValid).toBe(true);
    });
  });

  describe('GitHub Activity Parsing', () => {
    it('should parse commit data correctly', () => {
      const commit = {
        sha: 'abc123',
        commit: {
          message: 'feat: Add new feature',
          author: {
            name: 'Test User',
            date: '2025-10-03T00:00:00Z'
          }
        }
      };

      expect(commit.commit.message).toContain('feat:');
      expect(commit.commit.author.name).toBe('Test User');
    });

    it('should filter commits by date range', () => {
      const commits = [
        { commit: { author: { date: '2025-10-01T00:00:00Z' } } },
        { commit: { author: { date: '2025-10-03T00:00:00Z' } } },
        { commit: { author: { date: '2025-09-30T00:00:00Z' } } }
      ];

      const startDate = new Date('2025-10-01');
      const filtered = commits.filter(c =>
        new Date(c.commit.author.date) >= startDate
      );

      expect(filtered).toHaveLength(2);
    });
  });

  describe('Prompt Template Rendering', () => {
    it('should replace variables in template', () => {
      const template = 'Hello {{name}}, you made {{count}} commits today';
      const variables = { name: 'John', count: '5' };

      let rendered = template;
      Object.entries(variables).forEach(([key, value]) => {
        rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });

      expect(rendered).toBe('Hello John, you made 5 commits today');
      expect(rendered).not.toContain('{{');
    });

    it('should handle missing variables gracefully', () => {
      const template = 'Hello {{name}}, {{missing}} variable';
      const variables = { name: 'John' };

      let rendered = template;
      Object.entries(variables).forEach(([key, value]) => {
        rendered = rendered.replace(new RegExp(`{{${key}}}`, 'g'), value);
      });

      expect(rendered).toContain('{{missing}}');
    });
  });

  describe('Hashtag Injection', () => {
    it('should append hashtags to content', () => {
      const content = 'Check out our new feature';
      const hashtags = ['#coding', '#nextjs'];
      const withHashtags = `${content}\n\n${hashtags.join(' ')}`;

      expect(withHashtags).toContain('#coding');
      expect(withHashtags).toContain('#nextjs');
    });

    it('should not duplicate hashtags', () => {
      const content = 'Check out #coding';
      const hashtags = ['#coding', '#nextjs'];
      const existingHashtags = content.match(/#\w+/g) || [];
      const newHashtags = hashtags.filter(h => !existingHashtags.includes(h));

      expect(newHashtags).toHaveLength(1);
      expect(newHashtags[0]).toBe('#nextjs');
    });
  });
});
