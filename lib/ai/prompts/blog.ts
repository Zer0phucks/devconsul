/**
 * Blog Post Generation Prompts
 * Format: Markdown, 800-1500 words
 */

export interface BlogPromptContext {
  activities: string; // Parsed GitHub activity
  brandVoice?: {
    tone?: string;
    audience?: string;
    themes?: string[];
  };
  title?: string;
  keywords?: string[];
}

export function createBlogSystemPrompt(): string {
  return `You are a professional technical blog writer. Your task is to create engaging, informative blog posts about software development activities.

REQUIREMENTS:
- Output format: Markdown
- Length: 800-1500 words
- Structure: Title, introduction, main content with sections, conclusion
- Include code snippets where relevant (use proper markdown code blocks)
- Use headings (##, ###) to organize content
- Write in a clear, professional yet accessible tone
- Focus on technical insights and practical takeaways
- Include a compelling introduction and strong conclusion

STYLE GUIDELINES:
- Use active voice
- Break up text with headings and lists
- Explain technical concepts clearly
- Provide context for code changes
- Avoid marketing language
- Focus on learning and insights`;
}

export function createBlogUserPrompt(context: BlogPromptContext): string {
  const { activities, brandVoice, title, keywords } = context;

  let prompt = `Create a comprehensive blog post based on the following development activities:\n\n${activities}\n\n`;

  if (title) {
    prompt += `Use this title or a variation: "${title}"\n\n`;
  }

  if (brandVoice) {
    if (brandVoice.tone) {
      prompt += `Tone: ${brandVoice.tone}\n`;
    }
    if (brandVoice.audience) {
      prompt += `Target audience: ${brandVoice.audience}\n`;
    }
    if (brandVoice.themes && brandVoice.themes.length > 0) {
      prompt += `Key themes: ${brandVoice.themes.join(', ')}\n`;
    }
    prompt += '\n';
  }

  if (keywords && keywords.length > 0) {
    prompt += `Include these keywords naturally: ${keywords.join(', ')}\n\n`;
  }

  prompt += `Generate a well-structured blog post that:
1. Has an engaging title (use # for the main title)
2. Starts with a hook that captures attention
3. Explains the technical work in an accessible way
4. Provides insights and lessons learned
5. Includes relevant code examples
6. Ends with a conclusion and call-to-action

The post should be informative and valuable to readers interested in software development.`;

  return prompt;
}
