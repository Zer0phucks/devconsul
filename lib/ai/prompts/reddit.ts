/**
 * Reddit Post Generation Prompts
 * Format: Markdown, subreddit-appropriate tone
 */

export interface RedditPromptContext {
  activities: string;
  subreddit?: string;
  brandVoice?: {
    tone?: string;
    audience?: string;
    themes?: string[];
  };
  includeCodeBlocks?: boolean;
}

export function createRedditSystemPrompt(): string {
  return `You are a Reddit content creator for developer communities. Your task is to create authentic, valuable posts that fit Reddit's culture.

REQUIREMENTS:
- Output format: Markdown
- Tone: Authentic, humble, community-focused
- Avoid self-promotion or marketing language
- Focus on sharing knowledge and learning
- Use markdown for code blocks when relevant
- Be transparent about challenges and mistakes
- Value substance over hype

REDDIT COMMUNITY GUIDELINES:
- Lead with value, not promotion
- Be honest about successes AND failures
- Show your work and reasoning
- Respect the community's knowledge
- Use "I learned" not "I'm great at"
- Include code examples when helpful
- Ask for feedback or input
- Acknowledge if you're still learning
- Avoid corporate/marketing speak
- Be genuine and conversational`;
}

export function createRedditUserPrompt(context: RedditPromptContext): string {
  const { activities, subreddit, brandVoice, includeCodeBlocks = true } = context;

  let prompt = `Create a Reddit post based on these development activities:\n\n${activities}\n\n`;

  if (subreddit) {
    prompt += `Target subreddit: r/${subreddit}\n`;
    prompt += `Adapt the tone and content to fit this community's culture and rules.\n\n`;
  }

  if (brandVoice) {
    if (brandVoice.tone) {
      prompt += `Base tone: ${brandVoice.tone} (but keep it Reddit-authentic)\n`;
    }
    if (brandVoice.audience) {
      prompt += `Audience: ${brandVoice.audience}\n`;
    }
    if (brandVoice.themes && brandVoice.themes.length > 0) {
      prompt += `Themes: ${brandVoice.themes.join(', ')}\n`;
    }
    prompt += '\n';
  }

  prompt += `Generate a Reddit post that:
1. Has a clear, descriptive title (start with "Title: ")
2. Opens by sharing context and motivation
3. Explains what you built/learned and WHY
4. Is honest about challenges or mistakes
5. Uses markdown formatting appropriately`;

  if (includeCodeBlocks) {
    prompt += `
6. Includes relevant code snippets in markdown code blocks`;
  }

  prompt += `
7. Asks for feedback, suggestions, or shares learnings
8. Avoids any marketing or promotional language
9. Feels authentic and community-focused

Remember: Reddit values authenticity and substance. Share knowledge, not promotion. Be genuine about your experience, including what didn't work.`;

  return prompt;
}
