'use client';

/**
 * Prompt Form Component
 * Create/edit AI prompts with quality validation
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createPromptSchema, type CreatePromptInput } from '@/lib/validations/prompt';
import type { Platform } from '@prisma/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { PromptEditor } from './PromptEditor';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

const PLATFORMS: { value: Platform; label: string }[] = [
  { value: 'BLOG', label: 'Blog' },
  { value: 'NEWSLETTER', label: 'Newsletter' },
  { value: 'TWITTER', label: 'Twitter' },
  { value: 'LINKEDIN', label: 'LinkedIn' },
  { value: 'DEVTO', label: 'Dev.to' },
  { value: 'HASHNODE', label: 'Hashnode' },
];

const CATEGORIES = [
  { value: 'TECHNICAL_UPDATE', label: 'Technical Update' },
  { value: 'FEATURE_ANNOUNCEMENT', label: 'Feature Announcement' },
  { value: 'BUG_FIX', label: 'Bug Fix' },
  { value: 'RELEASE_NOTES', label: 'Release Notes' },
  { value: 'TUTORIAL', label: 'Tutorial' },
  { value: 'CASE_STUDY', label: 'Case Study' },
  { value: 'WEEKLY_DIGEST', label: 'Weekly Digest' },
  { value: 'MONTHLY_SUMMARY', label: 'Monthly Summary' },
  { value: 'PRODUCT_UPDATE', label: 'Product Update' },
  { value: 'COMMUNITY_UPDATE', label: 'Community Update' },
  { value: 'CUSTOM', label: 'Custom' },
];

const TONES = [
  'professional',
  'casual',
  'technical',
  'friendly',
  'formal',
  'engaging',
  'educational',
  'conversational',
];

const CONTENT_TYPES = [
  'blog_post',
  'twitter_thread',
  'email_newsletter',
  'linkedin_post',
  'tutorial',
  'release_notes',
  'case_study',
  'announcement',
];

interface PromptFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreatePromptInput) => Promise<void>;
  defaultValues?: Partial<CreatePromptInput>;
  mode?: 'create' | 'edit';
  templateId?: string;
}

export function PromptForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  mode = 'create',
  templateId,
}: PromptFormProps) {
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(defaultValues?.tags || []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<CreatePromptInput>({
    resolver: zodResolver(createPromptSchema),
    defaultValues: {
      name: '',
      description: '',
      category: 'TECHNICAL_UPDATE',
      platform: 'BLOG',
      systemPrompt: '',
      userPrompt: '',
      contentType: '',
      tone: '',
      targetLength: undefined,
      isPublic: false,
      tags: [],
      variables: [],
      templateId: templateId,
      ...defaultValues,
    },
  });

  const platform = watch('platform');
  const category = watch('category');
  const systemPrompt = watch('systemPrompt');
  const userPrompt = watch('userPrompt');
  const isPublic = watch('isPublic');
  const contentType = watch('contentType');
  const tone = watch('tone');

  const onFormSubmit = async (data: CreatePromptInput) => {
    const submitData = {
      ...data,
      tags,
      templateId: templateId || data.templateId,
    };
    await onSubmit(submitData);
    reset();
    setTags([]);
    onOpenChange(false);
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create AI Prompt' : 'Edit AI Prompt'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Create a reusable AI prompt for content generation.'
              : 'Update your AI prompt configuration.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Prompt Name *</Label>
              <Input
                id="name"
                placeholder="Technical Blog Post - Detailed"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={category}
                onValueChange={(value) => setValue('category', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-red-600">{errors.category.message}</p>
              )}
            </div>
          </div>

          {/* Platform */}
          <div className="space-y-2">
            <Label htmlFor="platform">Platform *</Label>
            <Select
              value={platform}
              onValueChange={(value) => setValue('platform', value as Platform)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select platform" />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.platform && (
              <p className="text-sm text-red-600">{errors.platform.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Comprehensive technical blog post for development updates..."
              rows={2}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          {/* Prompt Editor */}
          <PromptEditor
            systemPrompt={systemPrompt || ''}
            userPrompt={userPrompt || ''}
            onSystemPromptChange={(value) => setValue('systemPrompt', value)}
            onUserPromptChange={(value) => setValue('userPrompt', value)}
            showQualityScore={true}
          />
          {errors.systemPrompt && (
            <p className="text-sm text-red-600">{errors.systemPrompt.message}</p>
          )}
          {errors.userPrompt && (
            <p className="text-sm text-red-600">{errors.userPrompt.message}</p>
          )}

          {/* Advanced Options */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contentType">Content Type</Label>
              <Select
                value={contentType || ''}
                onValueChange={(value) => setValue('contentType', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  {CONTENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tone">Tone</Label>
              <Select
                value={tone || ''}
                onValueChange={(value) => setValue('tone', value || undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Optional" />
                </SelectTrigger>
                <SelectContent>
                  {TONES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetLength">Target Length (words)</Label>
              <Input
                id="targetLength"
                type="number"
                placeholder="1000"
                {...register('targetLength', { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addTag}>
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Public/Private */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <Label htmlFor="isPublic" className="text-base">
                Public Prompt
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                Make this prompt available to all users in your organization
              </p>
            </div>
            <Switch
              id="isPublic"
              checked={isPublic}
              onCheckedChange={(checked) => setValue('isPublic', checked)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? mode === 'create'
                  ? 'Creating...'
                  : 'Updating...'
                : mode === 'create'
                  ? 'Create Prompt'
                  : 'Update Prompt'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
