/**
 * Generic webhook integration client
 * Supports HMAC-SHA256 request signing and custom payloads
 */

import { createHmac } from 'crypto';
import type { PublishResponse } from '@/lib/validations/blog-platforms';

export interface WebhookConfig {
  url: string;
  method: 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  payloadTemplate?: string; // JSON template with {variable} placeholders
  signatureSecret?: string; // For HMAC signing
  retryAttempts?: number;
  retryDelay?: number; // seconds
}

export interface WebhookPayload {
  title: string;
  content: string;
  author?: string;
  publishedAt?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

/**
 * Generate HMAC-SHA256 signature for webhook
 */
function generateSignature(payload: string, secret: string): string {
  const hmac = createHmac('sha256', secret);
  hmac.update(payload);
  return hmac.digest('hex');
}

/**
 * Replace variables in payload template
 */
function processPayloadTemplate(
  template: string,
  data: WebhookPayload
): string {
  let processed = template;

  // Replace variables
  processed = processed.replace(/\{title\}/g, data.title);
  processed = processed.replace(/\{content\}/g, data.content);
  processed = processed.replace(/\{author\}/g, data.author || '');
  processed = processed.replace(/\{date\}/g, data.publishedAt || new Date().toISOString());

  // Replace tags (as JSON array)
  const tagsJson = JSON.stringify(data.tags || []);
  processed = processed.replace(/\{tags\}/g, tagsJson);

  // Replace metadata (as JSON object)
  const metadataJson = JSON.stringify(data.metadata || {});
  processed = processed.replace(/\{metadata\}/g, metadataJson);

  return processed;
}

/**
 * Send webhook with retry logic
 */
export async function sendWebhook(
  config: WebhookConfig,
  payload: WebhookPayload,
  options: { dryRun?: boolean } = {}
): Promise<PublishResponse> {
  const {
    url,
    method,
    headers = {},
    payloadTemplate,
    signatureSecret,
    retryAttempts = 3,
    retryDelay = 60,
  } = config;

  try {
    // Process payload template or use default JSON
    let body: string;
    if (payloadTemplate) {
      body = processPayloadTemplate(payloadTemplate, payload);
    } else {
      body = JSON.stringify({
        title: payload.title,
        content: payload.content,
        author: payload.author,
        publishedAt: payload.publishedAt || new Date().toISOString(),
        tags: payload.tags || [],
        metadata: payload.metadata || {},
      });
    }

    // Generate signature if secret provided
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      ...headers,
    };

    if (signatureSecret) {
      const signature = generateSignature(body, signatureSecret);
      requestHeaders['X-Webhook-Signature'] = `sha256=${signature}`;
      requestHeaders['X-Webhook-Timestamp'] = Date.now().toString();
    }

    // Dry run mode - validate but don't send
    if (options.dryRun) {
      return {
        success: true,
        metadata: {
          dryRun: true,
          url,
          method,
          headers: requestHeaders,
          bodyPreview: body.substring(0, 500),
        },
      };
    }

    // Send webhook with retry logic
    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= retryAttempts; attempt++) {
      try {
        const response = await fetch(url, {
          method,
          headers: requestHeaders,
          body,
        });

        if (!response.ok) {
          throw new Error(`Webhook failed: ${response.status} ${await response.text()}`);
        }

        // Success
        const responseData = await response.json().catch(() => null);

        return {
          success: true,
          metadata: {
            statusCode: response.status,
            responseData,
            attempt: attempt + 1,
          },
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        // Don't retry on last attempt
        if (attempt < retryAttempts) {
          // Exponential backoff
          const delay = retryDelay * 1000 * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    return {
      success: false,
      error: `Webhook failed after ${retryAttempts + 1} attempts: ${lastError?.message}`,
      metadata: {
        attempts: retryAttempts + 1,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Test webhook configuration
 */
export async function testWebhook(config: WebhookConfig): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  // Validate URL
  try {
    new URL(config.url);
  } catch {
    errors.push('Invalid webhook URL');
  }

  // Validate method
  if (!['POST', 'PUT', 'PATCH'].includes(config.method)) {
    errors.push('Method must be POST, PUT, or PATCH');
  }

  // Validate payload template if provided
  if (config.payloadTemplate) {
    try {
      JSON.parse(config.payloadTemplate);
    } catch {
      errors.push('Payload template must be valid JSON');
    }
  }

  // Test connection (dry run)
  if (errors.length === 0) {
    const testPayload: WebhookPayload = {
      title: 'Test Post',
      content: 'This is a test webhook',
      author: 'System',
      publishedAt: new Date().toISOString(),
    };

    const result = await sendWebhook(config, testPayload, { dryRun: true });

    if (!result.success) {
      errors.push(result.error || 'Webhook test failed');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Verify webhook signature (for receiving webhooks)
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  timestamp?: string
): boolean {
  // Verify timestamp is recent (within 5 minutes)
  if (timestamp) {
    const timestampMs = parseInt(timestamp, 10);
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    if (Math.abs(now - timestampMs) > fiveMinutes) {
      return false;
    }
  }

  // Generate expected signature
  const expectedSignature = generateSignature(payload, secret);
  const providedSignature = signature.replace('sha256=', '');

  // Constant-time comparison to prevent timing attacks
  if (expectedSignature.length !== providedSignature.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < expectedSignature.length; i++) {
    result |= expectedSignature.charCodeAt(i) ^ providedSignature.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Create default payload template
 */
export function createDefaultPayloadTemplate(): string {
  return JSON.stringify(
    {
      title: '{title}',
      content: '{content}',
      author: '{author}',
      published_at: '{date}',
      tags: '{tags}',
      custom_metadata: '{metadata}',
    },
    null,
    2
  );
}

/**
 * Validate payload template variables
 */
export function validatePayloadTemplate(template: string): {
  valid: boolean;
  errors: string[];
  variables: string[];
} {
  const errors: string[] = [];
  const variables: string[] = [];

  try {
    JSON.parse(template);

    // Extract variables
    const variableRegex = /\{(\w+)\}/g;
    let match;
    while ((match = variableRegex.exec(template)) !== null) {
      variables.push(match[1]);
    }

    // Check for supported variables
    const supported = ['title', 'content', 'author', 'date', 'tags', 'metadata'];
    const unsupported = variables.filter(v => !supported.includes(v));

    if (unsupported.length > 0) {
      errors.push(`Unsupported variables: ${unsupported.join(', ')}`);
    }
  } catch {
    errors.push('Template must be valid JSON');
  }

  return {
    valid: errors.length === 0,
    errors,
    variables: [...new Set(variables)], // Remove duplicates
  };
}
export function createWebhookClient(config: any) { throw new Error('Webhook client not implemented'); }
