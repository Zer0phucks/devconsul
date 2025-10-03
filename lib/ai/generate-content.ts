/**
 * AI Content Generation Helper
 * Used by content editor for regeneration
 */

import { generateText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';

export interface GenerateContentOptions {
  prompt: string;
  platform: string;
  model?: 'gpt-3.5-turbo' | 'gpt-4' | 'claude-3-sonnet';
  maxTokens?: number;
}

export interface GenerateContentResult {
  content: string;
  cost: number;
  model: string;
}

/**
 * Generate content using AI
 */
export async function generateContent(
  prompt: string,
  platform: string,
  model: 'gpt-3.5-turbo' | 'gpt-4' | 'claude-3-sonnet' = 'gpt-4'
): Promise<GenerateContentResult> {
  try {
    const systemPrompt = `You are a content creation assistant. Generate high-quality content for the ${platform} platform.`;

    let aiModel;
    let estimatedCost = 0;

    // Select AI model
    switch (model) {
      case 'gpt-3.5-turbo':
        aiModel = openai('gpt-3.5-turbo');
        estimatedCost = 0.001;
        break;
      case 'gpt-4':
        aiModel = openai('gpt-4');
        estimatedCost = 0.003;
        break;
      case 'claude-3-sonnet':
        aiModel = anthropic('claude-3-sonnet-20240229');
        estimatedCost = 0.003;
        break;
      default:
        aiModel = openai('gpt-4');
        estimatedCost = 0.003;
    }

    // Generate content
    const { text } = await generateText({
      model: aiModel,
      system: systemPrompt,
      prompt,
      maxTokens: 2000,
    });

    return {
      content: text,
      cost: estimatedCost,
      model,
    };
  } catch (error) {
    console.error('Failed to generate content:', error);
    throw new Error('Failed to generate content with AI');
  }
}

/**
 * Refine existing content
 */
export async function refineContent(
  originalContent: string,
  refinementPrompt: string,
  model: 'gpt-3.5-turbo' | 'gpt-4' | 'claude-3-sonnet' = 'gpt-4'
): Promise<GenerateContentResult> {
  const prompt = `Original content:\n\n${originalContent}\n\nRefinement instructions: ${refinementPrompt}\n\nPlease provide the refined version:`;

  return generateContent(prompt, 'general', model);
}
