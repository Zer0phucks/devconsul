/**
 * Unit tests for Twitter Prompt Templates
 */

import {
  createTwitterSystemPrompt,
  createTwitterUserPrompt,
  type TwitterPromptContext,
} from '@/lib/ai/prompts/twitter';

describe('Twitter Prompt Templates', () => {
  describe('createTwitterSystemPrompt()', () => {
    it('should create system prompt with Twitter requirements', () => {
      const prompt = createTwitterSystemPrompt();

      expect(prompt).toContain('Twitter/X content creator');
      expect(prompt).toContain('280 characters');
      expect(prompt).toContain('5-10 tweets');
      expect(prompt).toContain('Numbered thread');
    });

    it('should include best practices', () => {
      const prompt = createTwitterSystemPrompt();

      expect(prompt).toContain('Hook readers');
      expect(prompt).toContain('One main point per tweet');
      expect(prompt).toContain('call-to-action');
      expect(prompt).toContain('hashtags strategically');
    });

    it('should specify formatting requirements', () => {
      const prompt = createTwitterSystemPrompt();

      expect(prompt).toContain('1/, 2/, 3/');
      expect(prompt).toContain('line breaks');
      expect(prompt).toContain('emojis sparingly');
    });
  });

  describe('createTwitterUserPrompt()', () => {
    const baseContext: TwitterPromptContext = {
      activities: 'feat: Add authentication\nfix: Resolve login bug',
    };

    it('should create user prompt with activities', () => {
      const prompt = createTwitterUserPrompt(baseContext);

      expect(prompt).toContain('feat: Add authentication');
      expect(prompt).toContain('fix: Resolve login bug');
    });

    it('should include default thread length', () => {
      const prompt = createTwitterUserPrompt(baseContext);

      expect(prompt).toContain('7 tweets total');
    });

    it('should use custom thread length', () => {
      const prompt = createTwitterUserPrompt({
        ...baseContext,
        threadLength: 10,
      });

      expect(prompt).toContain('10 tweets total');
    });

    it('should include hashtags by default', () => {
      const prompt = createTwitterUserPrompt(baseContext);

      expect(prompt).toContain('2-3 relevant hashtags');
      expect(prompt).toContain('#webdev #javascript #coding');
    });

    it('should exclude hashtags when disabled', () => {
      const prompt = createTwitterUserPrompt({
        ...baseContext,
        includeHashtags: false,
      });

      expect(prompt).not.toContain('hashtags');
    });

    it('should include brand voice tone', () => {
      const prompt = createTwitterUserPrompt({
        ...baseContext,
        brandVoice: {
          tone: 'professional and friendly',
        },
      });

      expect(prompt).toContain('Tone: professional and friendly');
    });

    it('should include brand voice audience', () => {
      const prompt = createTwitterUserPrompt({
        ...baseContext,
        brandVoice: {
          audience: 'senior developers',
        },
      });

      expect(prompt).toContain('Audience: senior developers');
    });

    it('should include brand voice themes', () => {
      const prompt = createTwitterUserPrompt({
        ...baseContext,
        brandVoice: {
          themes: ['innovation', 'best practices', 'developer experience'],
        },
      });

      expect(prompt).toContain('Themes: innovation, best practices, developer experience');
    });

    it('should include all brand voice parameters', () => {
      const prompt = createTwitterUserPrompt({
        ...baseContext,
        brandVoice: {
          tone: 'casual',
          audience: 'junior developers',
          themes: ['learning', 'tips'],
        },
      });

      expect(prompt).toContain('Tone: casual');
      expect(prompt).toContain('Audience: junior developers');
      expect(prompt).toContain('Themes: learning, tips');
    });

    it('should include character limit reminder', () => {
      const prompt = createTwitterUserPrompt(baseContext);

      expect(prompt).toContain('CRITICAL');
      expect(prompt).toContain('under 280 characters');
      expect(prompt).toContain('split it into two tweets');
    });

    it('should specify thread numbering format', () => {
      const prompt = createTwitterUserPrompt(baseContext);

      expect(prompt).toContain('Number each tweet (1/, 2/, 3/, etc.)');
    });

    it('should request compelling hook', () => {
      const prompt = createTwitterUserPrompt(baseContext);

      expect(prompt).toContain('Make tweet 1 a compelling hook');
      expect(prompt).toContain('Opens with a hook');
    });

    it('should specify content requirements', () => {
      const prompt = createTwitterUserPrompt(baseContext);

      expect(prompt).toContain('Breaks down the technical work');
      expect(prompt).toContain('Each tweet stands alone');
      expect(prompt).toContain('flows into the next');
      expect(prompt).toContain('clear, conversational language');
    });

    it('should handle code snippet requirements', () => {
      const prompt = createTwitterUserPrompt(baseContext);

      expect(prompt).toContain('code snippets only if they fit');
      expect(prompt).toContain('inline code formatting');
    });

    it('should handle empty brand voice object', () => {
      const prompt = createTwitterUserPrompt({
        ...baseContext,
        brandVoice: {},
      });

      // Should not throw, and should not include empty brand voice sections
      expect(prompt).not.toContain('Tone:');
      expect(prompt).not.toContain('Audience:');
      expect(prompt).not.toContain('Themes:');
    });

    it('should handle empty themes array', () => {
      const prompt = createTwitterUserPrompt({
        ...baseContext,
        brandVoice: {
          themes: [],
        },
      });

      expect(prompt).not.toContain('Themes:');
    });
  });

  describe('Character Limit Validation', () => {
    it('should enforce strict 280 character limit in system prompt', () => {
      const systemPrompt = createTwitterSystemPrompt();

      expect(systemPrompt).toContain('280 characters PER TWEET (strict limit)');
    });

    it('should enforce character limit in user prompt', () => {
      const prompt = createTwitterUserPrompt({
        activities: 'feat: Add authentication',
      });

      expect(prompt).toContain('under 280 characters');
    });

    it('should provide guidance for long tweets', () => {
      const prompt = createTwitterUserPrompt({
        activities: 'feat: Add authentication',
      });

      expect(prompt).toContain('If a tweet is too long, split it');
    });
  });

  describe('Thread Structure Requirements', () => {
    it('should specify thread flow requirements', () => {
      const prompt = createTwitterUserPrompt({
        activities: 'feat: Add authentication',
      });

      expect(prompt).toContain('Each tweet stands alone');
      expect(prompt).toContain('flows into the next');
    });

    it('should specify hook requirements', () => {
      const prompt = createTwitterUserPrompt({
        activities: 'feat: Add authentication',
      });

      expect(prompt).toContain('hook that makes people want to read more');
    });
  });

  describe('Integration Context', () => {
    it('should handle complex activity descriptions', () => {
      const complexActivities = `
COMMITS:
- feat: Add OAuth2 authentication flow
- fix: Resolve session timeout issues
- refactor: Improve token validation

PULL REQUESTS:
- PR #42: Implement SSO integration
- PR #43: Add multi-factor authentication

RELEASES:
- v2.0.0: Major security update
      `.trim();

      const prompt = createTwitterUserPrompt({
        activities: complexActivities,
      });

      expect(prompt).toContain('OAuth2 authentication');
      expect(prompt).toContain('SSO integration');
      expect(prompt).toContain('v2.0.0');
    });

    it('should support minimal context', () => {
      const prompt = createTwitterUserPrompt({
        activities: 'Single commit message',
      });

      expect(prompt).toContain('Single commit message');
    });
  });
});
