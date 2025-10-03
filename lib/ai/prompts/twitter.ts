/**
 * Twitter/X Thread Generation Prompts
 * Format: Thread of 5-10 tweets, 280 chars max per tweet
 */

export interface TwitterPromptContext {
  activities: string;
  brandVoice?: {
    tone?: string;
    audience?: string;
    themes?: string[];
  };
  includeHashtags?: boolean;
  threadLength?: number;
}

export function createTwitterSystemPrompt(): string {
  return `You are a professional Twitter/X content creator for developers. Your task is to create engaging tweet threads about software development.

REQUIREMENTS:
- Output format: Numbered thread (1/, 2/, 3/, etc.)
- Character limit: 280 characters PER TWEET (strict limit)
- Thread length: 5-10 tweets
- Use line breaks within tweets for readability
- Include relevant hashtags (max 2-3 per thread)
- Use emojis sparingly for emphasis
- Make the first tweet a compelling hook

TWITTER BEST PRACTICES:
- Hook readers in tweet 1
- One main point per tweet
- Use simple, clear language
- Break complex ideas into digestible chunks
- End with a call-to-action or question
- Use hashtags strategically
- Avoid jargon unless necessary`;
}

export function createTwitterUserPrompt(context: TwitterPromptContext): string {
  const {
    activities,
    brandVoice,
    includeHashtags = true,
    threadLength = 7,
  } = context;

  let prompt = `Create a Twitter/X thread based on these development activities:\n\n${activities}\n\n`;

  prompt += `Thread requirements:
- ${threadLength} tweets total
- Each tweet MUST be under 280 characters
- Number each tweet (1/, 2/, 3/, etc.)
- Make tweet 1 a compelling hook\n\n`;

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

  prompt += `Generate a Twitter thread that:
1. Opens with a hook that makes people want to read more
2. Breaks down the technical work into digestible tweets
3. Each tweet stands alone but flows into the next
4. Uses clear, conversational language
5. Includes code snippets only if they fit (use inline code formatting)`;

  if (includeHashtags) {
    prompt += `
6. Adds 2-3 relevant hashtags at the end (e.g., #webdev #javascript #coding)`;
  }

  prompt += `

CRITICAL: Verify that EVERY tweet is under 280 characters. If a tweet is too long, split it into two tweets.`;

  return prompt;
}
