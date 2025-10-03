/**
 * Email Newsletter Generation Prompts
 * Format: HTML-friendly content, 300-600 words
 */

export interface EmailPromptContext {
  activities: string;
  brandVoice?: {
    tone?: string;
    audience?: string;
    themes?: string[];
  };
  subject?: string;
  includeCallToAction?: boolean;
}

export function createEmailSystemPrompt(): string {
  return `You are a professional email newsletter writer. Your task is to create engaging, scannable email content about software development updates.

REQUIREMENTS:
- Output format: HTML-friendly markdown (use simple formatting)
- Length: 300-600 words
- Structure: Subject line, greeting, main content, call-to-action, sign-off
- Use short paragraphs (2-3 sentences max)
- Include bullet points for easy scanning
- Write conversationally and personally
- Focus on what readers care about

EMAIL BEST PRACTICES:
- Start with the most important information
- Use "you" and "your" to address readers directly
- Keep sentences short and punchy
- One main idea per paragraph
- Include a clear call-to-action
- End with a personal sign-off`;
}

export function createEmailUserPrompt(context: EmailPromptContext): string {
  const { activities, brandVoice, subject, includeCallToAction = true } = context;

  let prompt = `Create an engaging email newsletter based on these development activities:\n\n${activities}\n\n`;

  if (subject) {
    prompt += `Subject line: "${subject}"\n\n`;
  } else {
    prompt += `Create a compelling subject line (start with "Subject: ")\n\n`;
  }

  if (brandVoice) {
    if (brandVoice.tone) {
      prompt += `Tone: ${brandVoice.tone}\n`;
    }
    if (brandVoice.audience) {
      prompt += `Audience: ${brandVoice.audience}\n`;
    }
    if (brandVoice.themes && brandVoice.themes.length > 0) {
      prompt += `Themes: ${brandVoice.themes.join(', ')}\n`;
    }
    prompt += '\n';
  }

  prompt += `Generate an email newsletter that:
1. Has a compelling subject line
2. Opens with a friendly greeting
3. Highlights the most interesting updates
4. Uses bullet points for key information
5. Keeps paragraphs short and scannable
6. Maintains a conversational tone`;

  if (includeCallToAction) {
    prompt += `
7. Includes a clear call-to-action (e.g., "Check out the code", "Try it yourself", etc.)`;
  }

  prompt += `
8. Ends with a personal sign-off

Make it feel like a personal update from a developer friend, not a corporate announcement.`;

  return prompt;
}
