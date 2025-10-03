'use client';

/**
 * Template Editor Component
 * Rich text editor with variable insertion toolbar and live validation
 */

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { useCallback, useEffect, useState } from 'react';
import type { Platform } from '@prisma/client';
import {
  Type,
  AtSign,
  Calendar,
  GitBranch,
  Hash,
  FileText,
  Link as LinkIcon,
  Bold,
  Italic,
  List,
  ListOrdered,
  Code,
  Heading2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Template variables organized by category
const TEMPLATE_VARIABLES = {
  Project: [
    { name: 'projectName', icon: FileText, description: 'Project name' },
    { name: 'repository', icon: GitBranch, description: 'Repository identifier (owner/repo)' },
    { name: 'repositoryUrl', icon: LinkIcon, description: 'Full repository URL' },
    { name: 'websiteUrl', icon: LinkIcon, description: 'Project website URL' },
  ],
  Activity: [
    { name: 'activity', icon: Sparkles, description: 'Activity summary' },
    { name: 'activityType', icon: Type, description: 'Type of activity' },
    { name: 'activityDate', icon: Calendar, description: 'Activity date' },
  ],
  Commits: [
    { name: 'latestCommit', icon: GitBranch, description: 'Latest commit message' },
    { name: 'latestCommitSha', icon: Hash, description: 'Latest commit SHA' },
    { name: 'allCommits', icon: GitBranch, description: 'All commits in activity' },
    { name: 'commitCount', icon: Hash, description: 'Number of commits' },
  ],
  Releases: [
    { name: 'latestRelease', icon: FileText, description: 'Latest release tag' },
    { name: 'latestReleaseVersion', icon: Hash, description: 'Latest version number' },
    { name: 'latestReleaseNotes', icon: FileText, description: 'Latest release notes' },
  ],
  Issues: [
    { name: 'issueNumber', icon: Hash, description: 'Issue number' },
    { name: 'issueTitle', icon: Type, description: 'Issue title' },
    { name: 'issueBody', icon: FileText, description: 'Issue description' },
    { name: 'issueAuthor', icon: AtSign, description: 'Issue author' },
  ],
  Pull_Requests: [
    { name: 'prNumber', icon: Hash, description: 'PR number' },
    { name: 'prTitle', icon: Type, description: 'PR title' },
    { name: 'prBody', icon: FileText, description: 'PR description' },
    { name: 'prAuthor', icon: AtSign, description: 'PR author' },
  ],
  Time: [
    { name: 'today', icon: Calendar, description: 'Current date' },
    { name: 'weekRange', icon: Calendar, description: 'Current week range' },
    { name: 'monthRange', icon: Calendar, description: 'Current month range' },
  ],
};

interface TemplateEditorProps {
  content: string;
  platform: Platform;
  onChange: (content: string) => void;
  onVariablesChange?: (variables: string[]) => void;
  placeholder?: string;
  className?: string;
  showValidation?: boolean;
}

export function TemplateEditor({
  content,
  platform,
  onChange,
  onVariablesChange,
  placeholder = 'Write your template content...\nUse {{variableName}} to insert dynamic content.',
  className = '',
  showValidation = true,
}: TemplateEditorProps) {
  const [detectedVariables, setDetectedVariables] = useState<string[]>([]);
  const [validationIssues, setValidationIssues] = useState<string[]>([]);

  // Initialize editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline hover:text-blue-800',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      onChange(text);

      // Extract variables from content
      const variableMatches = text.match(/\{\{(\w+)\}\}/g) || [];
      const variables = variableMatches.map((v) => v.replace(/[{}]/g, ''));
      setDetectedVariables([...new Set(variables)]);
      onVariablesChange?.(variables);

      // Validate content
      validateTemplate(text);
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none focus:outline-none min-h-[300px] px-4 py-3',
      },
    },
  });

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getText()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Validate template content
  const validateTemplate = useCallback((text: string) => {
    const issues: string[] = [];

    // Check for empty content
    if (!text.trim()) {
      issues.push('Template content is empty');
    }

    // Check for unclosed variable brackets
    const openBrackets = (text.match(/\{\{/g) || []).length;
    const closeBrackets = (text.match(/\}\}/g) || []).length;
    if (openBrackets !== closeBrackets) {
      issues.push('Unclosed variable brackets detected');
    }

    // Check for invalid variable names
    const invalidVars = text.match(/\{\{[^}]*[^a-zA-Z0-9_][^}]*\}\}/g);
    if (invalidVars) {
      issues.push('Invalid variable names (use only letters, numbers, underscores)');
    }

    // Platform-specific validation
    if (platform === 'TWITTER' && text.length > 2800) {
      issues.push('Content exceeds Twitter thread length (10 tweets × 280 chars)');
    }

    setValidationIssues(issues);
  }, [platform]);

  // Insert variable at cursor
  const insertVariable = useCallback((variableName: string) => {
    if (!editor) return;

    const variable = `{{${variableName}}}`;
    editor.chain().focus().insertContent(variable).run();
  }, [editor]);

  // Toolbar button component
  const ToolbarButton = ({
    onClick,
    active = false,
    disabled = false,
    children,
    title,
  }: {
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            disabled={disabled}
            className={`p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
              active ? 'bg-gray-200 text-blue-600' : 'text-gray-700'
            }`}
          >
            {children}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{title}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  if (!editor) {
    return <div className="animate-pulse bg-gray-100 h-96 rounded-lg" />;
  }

  return (
    <div className={`border rounded-lg bg-white ${className}`}>
      {/* Toolbar */}
      <div className="border-b bg-gray-50 p-2 flex flex-wrap items-center gap-1">
        {/* Text formatting */}
        <div className="flex items-center gap-1 border-r pr-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            title="Bold (Cmd+B)"
          >
            <Bold className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            title="Italic (Cmd+I)"
          >
            <Italic className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCode().run()}
            active={editor.isActive('code')}
            title="Inline code"
          >
            <Code className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Lists & Headings */}
        <div className="flex items-center gap-1 border-r pr-2">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive('heading', { level: 2 })}
            title="Heading"
          >
            <Heading2 className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            title="Bullet list"
          >
            <List className="w-4 h-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            title="Ordered list"
          >
            <ListOrdered className="w-4 h-4" />
          </ToolbarButton>
        </div>

        {/* Variable groups */}
        {Object.entries(TEMPLATE_VARIABLES).map(([category, variables]) => (
          <div key={category} className="flex items-center gap-1 border-r pr-2">
            <span className="text-xs text-gray-500 px-1">{category.replace('_', ' ')}</span>
            <div className="flex items-center gap-0.5">
              {variables.map((variable) => {
                const Icon = variable.icon;
                return (
                  <TooltipProvider key={variable.name}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => insertVariable(variable.name)}
                          className="p-1.5 rounded hover:bg-gray-100 transition-colors text-gray-600 hover:text-blue-600"
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div>
                          <p className="font-semibold">{`{{${variable.name}}}`}</p>
                          <p className="text-xs text-gray-500">{variable.description}</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Editor content */}
      <EditorContent editor={editor} />

      {/* Status bar */}
      <div className="border-t bg-gray-50 px-4 py-2 flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          {/* Detected variables */}
          {detectedVariables.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-gray-600 text-xs">Variables:</span>
              <div className="flex flex-wrap gap-1">
                {detectedVariables.map((variable) => (
                  <Badge key={variable} variant="secondary" className="text-xs">
                    {`{{${variable}}}`}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Validation status */}
        {showValidation && (
          <div className="flex items-center gap-2">
            {validationIssues.length === 0 ? (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs">Valid template</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-xs">{validationIssues.length} issue(s)</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Validation issues */}
      {showValidation && validationIssues.length > 0 && (
        <div className="border-t bg-red-50 px-4 py-2">
          <div className="text-sm">
            <p className="font-semibold text-red-800 mb-1">Validation Issues:</p>
            <ul className="list-disc list-inside text-red-700 space-y-1">
              {validationIssues.map((issue, index) => (
                <li key={index}>{issue}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
