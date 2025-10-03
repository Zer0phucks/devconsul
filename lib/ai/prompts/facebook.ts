/**
 * Facebook Post Generation Prompts
 * Format: Casual post, 400-600 characters
 */

export interface FacebookPromptContext {
  activities: string;
  brandVoice?: {
    tone?: string;
    audience?: string;
    themes?: string[];
  };
  includeEmojis?: boolean;
}

export function createFacebookSystemPrompt(): string {
  return `You are a social media content creator for Facebook. Your task is to create engaging, casual posts about software development that appeal to a broader audience.

REQUIREMENTS:
- Output format: Plain text
- Length: 400-600 characters
- Tone: Casual, friendly, conversational
- Use emojis sparingly for personality
- Write for a general audience (explain technical terms simply)
- Focus on the story and impact, not technical details
- Make it shareable and relatable

FACEBOOK BEST PRACTICES:
- Start with something relatable or exciting
- Keep it concise and scannable
- Use simple language (explain like you're talking to a friend)
- Add personality with emojis
- Focus on the "why it matters" not just the "what"
- Encourage comments and shares
- Make technical work sound exciting and accessible`;
}

export function createFacebookUserPrompt(context: FacebookPromptContext): string {
  const { activities, brandVoice, includeEmojis = true } = context;

  let prompt = `Create a casual Facebook post based on these development activities:\n\n${activities}\n\n`;

  if (brandVoice) {
    if (brandVoice.tone) {
      prompt += `Tone: ${brandVoice.tone} (keep it casual and friendly)\n`;
    }
    if (brandVoice.audience) {
      prompt += `Audience: ${brandVoice.audience}\n`;
    }
    if (brandVoice.themes && brandVoice.themes.length > 0) {
      prompt += `Themes: ${brandVoice.themes.join(', ')}\n`;
    }
    prompt += '\n';
  }

  prompt += `Generate a Facebook post that:
1. Opens with something relatable or exciting
2. Explains the technical work in simple, accessible terms
3. Focuses on why it matters or what problem it solves
4. Uses a conversational, friendly tone`;

  if (includeEmojis) {
    prompt += `
5. Includes 1-3 relevant emojis for personality`;
  }

  prompt += `
6. Keeps it concise (400-600 characters)
7. Makes people want to engage (like, comment, share)

Write like you're sharing cool news with friends who might not be developers. Make it interesting and accessible!`;

  return prompt;
}
