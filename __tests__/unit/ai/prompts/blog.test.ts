/**
 * Unit tests for Blog Prompt Templates
 */

import {
  createBlogSystemPrompt,
  createBlogUserPrompt,
  type BlogPromptContext,
} from '@/lib/ai/prompts/blog';

describe('Blog Prompt Templates', () => {
  describe('createBlogSystemPrompt()', () => {
    it('should create system prompt with blog requirements', () => {
      const prompt = createBlogSystemPrompt();

      expect(prompt).toContain('technical blog writer');
      expect(prompt).toContain('Markdown');
      expect(prompt).toContain('800-1500 words');
    });

    it('should specify structure requirements', () => {
      const prompt = createBlogSystemPrompt();

      expect(prompt).toContain('Title, introduction, main content with sections, conclusion');
      expect(prompt).toContain('headings (##, ###)');
      expect(prompt).toContain('code snippets');
    });

    it('should include style guidelines', () => {
      const prompt = createBlogSystemPrompt();

      expect(prompt).toContain('active voice');
      expect(prompt).toContain('Explain technical concepts');
      expect(prompt).toContain('Avoid marketing language');
      expect(prompt).toContain('learning and insights');
    });

    it('should specify tone requirements', () => {
      const prompt = createBlogSystemPrompt();

      expect(prompt).toContain('professional yet accessible');
    });
  });

  describe('createBlogUserPrompt()', () => {
    const baseContext: BlogPromptContext = {
      activities: 'feat: Add authentication\nfix: Resolve login bug',
    };

    it('should create user prompt with activities', () => {
      const prompt = createBlogUserPrompt(baseContext);

      expect(prompt).toContain('feat: Add authentication');
      expect(prompt).toContain('fix: Resolve login bug');
    });

    it('should include suggested title when provided', () => {
      const prompt = createBlogUserPrompt({
        ...baseContext,
        title: 'Building Secure Authentication',
      });

      expect(prompt).toContain('Use this title or a variation: "Building Secure Authentication"');
    });

    it('should work without title', () => {
      const prompt = createBlogUserPrompt(baseContext);

      expect(prompt).not.toContain('Use this title');
      expect(prompt).toContain('Has an engaging title');
    });

    it('should include keywords when provided', () => {
      const prompt = createBlogUserPrompt({
        ...baseContext,
        keywords: ['authentication', 'security', 'OAuth'],
      });

      expect(prompt).toContain('Include these keywords naturally: authentication, security, OAuth');
    });

    it('should handle empty keywords array', () => {
      const prompt = createBlogUserPrompt({
        ...baseContext,
        keywords: [],
      });

      expect(prompt).not.toContain('Include these keywords');
    });

    it('should include brand voice tone', () => {
      const prompt = createBlogUserPrompt({
        ...baseContext,
        brandVoice: {
          tone: 'educational and encouraging',
        },
      });

      expect(prompt).toContain('Tone: educational and encouraging');
    });

    it('should include brand voice audience', () => {
      const prompt = createBlogUserPrompt({
        ...baseContext,
        brandVoice: {
          audience: 'intermediate developers',
        },
      });

      expect(prompt).toContain('Target audience: intermediate developers');
    });

    it('should include brand voice themes', () => {
      const prompt = createBlogUserPrompt({
        ...baseContext,
        brandVoice: {
          themes: ['security', 'best practices', 'scalability'],
        },
      });

      expect(prompt).toContain('Key themes: security, best practices, scalability');
    });

    it('should include all brand voice parameters', () => {
      const prompt = createBlogUserPrompt({
        ...baseContext,
        brandVoice: {
          tone: 'professional',
          audience: 'senior engineers',
          themes: ['architecture', 'patterns'],
        },
      });

      expect(prompt).toContain('Tone: professional');
      expect(prompt).toContain('Target audience: senior engineers');
      expect(prompt).toContain('Key themes: architecture, patterns');
    });

    it('should handle empty brand voice object', () => {
      const prompt = createBlogUserPrompt({
        ...baseContext,
        brandVoice: {},
      });

      expect(prompt).not.toContain('Tone:');
      expect(prompt).not.toContain('Target audience:');
      expect(prompt).not.toContain('Key themes:');
    });

    it('should handle empty themes array', () => {
      const prompt = createBlogUserPrompt({
        ...baseContext,
        brandVoice: {
          themes: [],
        },
      });

      expect(prompt).not.toContain('Key themes:');
    });

    it('should specify content structure requirements', () => {
      const prompt = createBlogUserPrompt(baseContext);

      expect(prompt).toContain('Has an engaging title');
      expect(prompt).toContain('Starts with a hook');
      expect(prompt).toContain('Explains the technical work');
      expect(prompt).toContain('Provides insights and lessons learned');
      expect(prompt).toContain('Includes relevant code examples');
      expect(prompt).toContain('Ends with a conclusion');
    });

    it('should include markdown title format', () => {
      const prompt = createBlogUserPrompt(baseContext);

      expect(prompt).toContain('use # for the main title');
    });

    it('should request call-to-action', () => {
      const prompt = createBlogUserPrompt(baseContext);

      expect(prompt).toContain('call-to-action');
    });
  });

  describe('Complex Context Handling', () => {
    it('should handle all parameters together', () => {
      const context: BlogPromptContext = {
        activities: 'feat: Add OAuth\nfix: Session bug\nrelease: v2.0',
        title: 'Improving Authentication Security',
        keywords: ['OAuth', 'security', 'sessions'],
        brandVoice: {
          tone: 'professional and informative',
          audience: 'full-stack developers',
          themes: ['security', 'user experience'],
        },
      };

      const prompt = createBlogUserPrompt(context);

      expect(prompt).toContain('feat: Add OAuth');
      expect(prompt).toContain('Improving Authentication Security');
      expect(prompt).toContain('OAuth, security, sessions');
      expect(prompt).toContain('Tone: professional and informative');
      expect(prompt).toContain('Target audience: full-stack developers');
      expect(prompt).toContain('Key themes: security, user experience');
    });

    it('should handle complex activity descriptions', () => {
      const complexActivities = `
COMMITS:
- feat: Implement JWT authentication
- fix: Resolve token expiration issues
- refactor: Optimize session handling

PULL REQUESTS:
- PR #42: Add OAuth2 provider support
- PR #43: Implement refresh token rotation

RELEASES:
- v2.0.0: Major authentication overhaul
      `.trim();

      const prompt = createBlogUserPrompt({
        activities: complexActivities,
      });

      expect(prompt).toContain('JWT authentication');
      expect(prompt).toContain('OAuth2 provider support');
      expect(prompt).toContain('v2.0.0');
    });

    it('should support minimal context', () => {
      const prompt = createBlogUserPrompt({
        activities: 'Single feature addition',
      });

      expect(prompt).toContain('Single feature addition');
      expect(prompt).toContain('well-structured blog post');
    });
  });

  describe('Content Quality Guidelines', () => {
    it('should emphasize value to readers', () => {
      const prompt = createBlogUserPrompt({
        activities: 'feat: Add feature',
      });

      expect(prompt).toContain('informative and valuable to readers');
      expect(prompt).toContain('software development');
    });

    it('should request accessibility', () => {
      const prompt = createBlogUserPrompt({
        activities: 'feat: Add feature',
      });

      expect(prompt).toContain('accessible way');
    });
  });

  describe('Keyword Integration', () => {
    it('should request natural keyword inclusion', () => {
      const prompt = createBlogUserPrompt({
        activities: 'feat: Add feature',
        keywords: ['testing', 'CI/CD'],
      });

      expect(prompt).toContain('Include these keywords naturally');
      expect(prompt).toContain('testing, CI/CD');
    });

    it('should handle single keyword', () => {
      const prompt = createBlogUserPrompt({
        activities: 'feat: Add feature',
        keywords: ['microservices'],
      });

      expect(prompt).toContain('microservices');
    });

    it('should handle many keywords', () => {
      const keywords = [
        'React',
        'TypeScript',
        'testing',
        'performance',
        'accessibility',
      ];
      const prompt = createBlogUserPrompt({
        activities: 'feat: Add feature',
        keywords,
      });

      expect(prompt).toContain(keywords.join(', '));
    });
  });
});
