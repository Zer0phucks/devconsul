/**
 * LinkedIn Post Generation Prompts
 * Format: Professional post, 1300-3000 characters
 */

export interface LinkedInPromptContext {
  activities: string;
  brandVoice?: {
    tone?: string;
    audience?: string;
    themes?: string[];
  };
  includeHashtags?: boolean;
  includeCallToAction?: boolean;
}

export function createLinkedInSystemPrompt(): string {
  return `You are a professional LinkedIn content creator for software developers and tech professionals. Your task is to create engaging, professional posts about software development.

REQUIREMENTS:
- Output format: Plain text with line breaks
- Length: 1300-3000 characters
- Structure: Hook, main content with insights, conclusion
- Use line breaks to separate paragraphs
- Professional yet personable tone
- Focus on insights, learnings, and professional growth
- Include relevant hashtags at the end (3-5 hashtags)

LINKEDIN BEST PRACTICES:
- Start with a compelling first line (the hook)
- Share genuine insights and lessons learned
- Be authentic and show personality
- Use short paragraphs (1-3 sentences)
- Add strategic line breaks for readability
- Include specific examples or metrics
- End with engagement (question, call-to-action, or thought-provoking statement)
- Use hashtags that match professional communities`;
}

export function createLinkedInUserPrompt(context: LinkedInPromptContext): string {
  const {
    activities,
    brandVoice,
    includeHashtags = true,
    includeCallToAction = true,
  } = context;

  let prompt = `Create a professional LinkedIn post based on these development activities:\n\n${activities}\n\n`;

  if (brandVoice) {
    if (brandVoice.tone) {
      prompt += `Tone: ${brandVoice.tone} (maintain professionalism)\n`;
    }
    if (brandVoice.audience) {
      prompt += `Audience: ${brandVoice.audience}\n`;
    }
    if (brandVoice.themes && brandVoice.themes.length > 0) {
      prompt += `Themes: ${brandVoice.themes.join(', ')}\n`;
    }
    prompt += '\n';
  }

  prompt += `Generate a LinkedIn post that:
1. Opens with a hook that grabs attention in the first line
2. Shares technical insights and learnings from the work
3. Uses strategic line breaks between paragraphs
4. Maintains a professional yet authentic voice
5. Includes specific examples or outcomes
6. Shows thought leadership and expertise`;

  if (includeCallToAction) {
    prompt += `
7. Ends with a question or call-to-action to encourage engagement`;
  }

  if (includeHashtags) {
    prompt += `
8. Includes 3-5 relevant hashtags at the end (e.g., #SoftwareDevelopment #TechLeadership)`;
  }

  prompt += `

Keep the post between 1300-3000 characters. Make it authentic, insightful, and valuable to your professional network.`;

  return prompt;
}
