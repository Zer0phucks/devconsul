/**
 * Template Engine
 * Handles variable substitution and template rendering
 */

import type { TemplateVariables } from './variables';

export interface RenderOptions {
  /**
   * Whether to escape HTML in variable values
   */
  escapeHtml?: boolean;

  /**
   * Whether to throw error on missing variables
   */
  strict?: boolean;

  /**
   * Default value for missing variables
   */
  defaultValue?: string;

  /**
   * Custom variable transformer function
   */
  transformer?: (value: any, variableName: string) => string;
}

/**
 * Render a template with variable substitution
 */
export function renderTemplate(
  template: string,
  variables: TemplateVariables,
  options: RenderOptions = {}
): string {
  const {
    escapeHtml = false,
    strict = false,
    defaultValue = '',
    transformer,
  } = options;

  // Match {{variable}} or {{variable|filter}}
  const variableRegex = /\{\{([^}|]+)(?:\|([^}]+))?\}\}/g;

  return template.replace(variableRegex, (match, variableName, filter) => {
    const trimmedName = variableName.trim();
    let value = variables[trimmedName];

    // Handle missing variables
    if (value === undefined || value === null) {
      if (strict) {
        throw new Error(`Missing template variable: ${trimmedName}`);
      }
      return defaultValue;
    }

    // Convert to string
    let stringValue = String(value);

    // Apply filter if specified
    if (filter) {
      stringValue = applyFilter(stringValue, filter.trim(), variables);
    }

    // Apply custom transformer
    if (transformer) {
      stringValue = transformer(stringValue, trimmedName);
    }

    // Escape HTML if needed
    if (escapeHtml) {
      stringValue = escapeHtmlString(stringValue);
    }

    return stringValue;
  });
}

/**
 * Apply filter to variable value
 */
function applyFilter(
  value: string,
  filter: string,
  variables: TemplateVariables
): string {
  const [filterName, ...args] = filter.split(':');

  switch (filterName.toLowerCase()) {
    case 'upper':
    case 'uppercase':
      return value.toUpperCase();

    case 'lower':
    case 'lowercase':
      return value.toLowerCase();

    case 'title':
    case 'titlecase':
      return toTitleCase(value);

    case 'truncate':
      const length = parseInt(args[0]) || 100;
      return truncate(value, length);

    case 'default':
      return value || args[0] || '';

    case 'first':
      const lines = value.split('\n');
      return lines[0] || '';

    case 'count':
      return String(value.split('\n').filter(l => l.trim()).length);

    case 'capitalize':
      return value.charAt(0).toUpperCase() + value.slice(1);

    case 'replace':
      if (args.length >= 2) {
        const [search, replace] = args;
        return value.replace(new RegExp(search, 'g'), replace);
      }
      return value;

    case 'date':
      // Simple date formatting
      const dateFormat = args[0] || 'long';
      try {
        const date = new Date(value);
        if (dateFormat === 'short') {
          return date.toLocaleDateString();
        } else if (dateFormat === 'long') {
          return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
        }
      } catch {
        return value;
      }
      return value;

    default:
      // Unknown filter - return as is
      return value;
  }
}

/**
 * Extract variable names from template
 */
export function extractVariableNames(template: string): string[] {
  const variableRegex = /\{\{([^}|]+)(?:\|[^}]+)?\}\}/g;
  const matches = template.matchAll(variableRegex);
  const names = new Set<string>();

  for (const match of matches) {
    names.add(match[1].trim());
  }

  return Array.from(names);
}

/**
 * Validate template syntax
 */
export function validateTemplate(template: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check for unclosed variable tags
  const openCount = (template.match(/\{\{/g) || []).length;
  const closeCount = (template.match(/\}\}/g) || []).length;

  if (openCount !== closeCount) {
    errors.push('Mismatched variable tags - unclosed {{ or }}');
  }

  // Check for nested variables
  if (template.includes('{{{{') || template.includes('}}}}')) {
    errors.push('Nested variable tags are not supported');
  }

  // Check for empty variable names
  if (template.match(/\{\{\s*\}\}/)) {
    errors.push('Empty variable names are not allowed');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if template uses specific variable
 */
export function templateUsesVariable(template: string, variableName: string): boolean {
  const variables = extractVariableNames(template);
  return variables.includes(variableName);
}

/**
 * Get preview of rendered template with sample data
 */
export function getTemplatePreview(
  template: string,
  sampleVariables?: Partial<TemplateVariables>
): string {
  const defaultSamples: TemplateVariables = {
    repository: 'awesome-project',
    repositoryOwner: 'johndoe',
    activity: '3 commits, 1 pull request',
    commitCount: 3,
    latestCommit: 'Fix authentication bug',
    date: '2024-01-15',
    dateLong: 'January 15, 2024',
    projectName: 'My SaaS Platform',
    authorName: 'John Doe',
    tone: 'professional',
  };

  const variables = { ...defaultSamples, ...sampleVariables };

  try {
    return renderTemplate(template, variables, { strict: false, defaultValue: '[missing]' });
  } catch (error) {
    return `Error rendering preview: ${error}`;
  }
}

/**
 * Utility: Escape HTML special characters
 */
function escapeHtmlString(str: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };

  return str.replace(/[&<>"']/g, char => htmlEscapes[char]);
}

/**
 * Utility: Convert to title case
 */
function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, (word) => {
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
}

/**
 * Utility: Truncate string with ellipsis
 */
function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

/**
 * Batch render multiple templates
 */
export function renderTemplates(
  templates: Array<{ id: string; template: string }>,
  variables: TemplateVariables,
  options?: RenderOptions
): Array<{ id: string; rendered: string; error?: string }> {
  return templates.map(({ id, template }) => {
    try {
      const rendered = renderTemplate(template, variables, options);
      return { id, rendered };
    } catch (error) {
      return {
        id,
        rendered: '',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
}

/**
 * Create a template with commonly used structure
 */
export function createTemplateScaffold(platform: string): string {
  const scaffolds: Record<string, string> = {
    blog: `# {{projectName}} Development Update - {{dateLong}}

## What's New

{{activity}}

## Latest Changes

{{allCommits}}

## What's Next

Coming soon in future updates!

---
*Generated from {{repository}} activity*`,

    email: `Subject: {{projectName}} Update - {{monthName}} {{year}}

Hi there!

Here's what's been happening with {{projectName}} this week:

{{activity}}

Recent highlights:
{{allCommits|truncate:500}}

Best regards,
{{authorName}}

---
Unsubscribe: {{unsubscribeUrl}}`,

    twitter: `📢 New update to {{repository}}!

{{latestCommit}}

{{commitCount}} commits this week
{{latestCommitUrl}}

#dev #opensource`,

    linkedin: `🚀 {{projectName}} Development Update

This week we shipped {{commitCount}} commits including:

{{allCommits|truncate:400}}

Latest release: {{latestRelease}}

Read more: {{repositoryUrl}}`,

    newsletter: `# {{projectName}} Newsletter - {{monthName}} {{year}}

## This Month's Highlights

{{activity}}

## Recent Releases

{{latestReleaseNotes}}

## What's Next

Stay tuned for more updates!

---
You're receiving this because you subscribed to {{projectName}}.
[Unsubscribe]({{unsubscribeUrl}})`,
  };

  return scaffolds[platform] || scaffolds.blog;
}
