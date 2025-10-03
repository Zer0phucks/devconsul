'use client';

/**
 * Template Form Component
 * Create/edit template with validation
 */

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createTemplateSchema, type CreateTemplateInput } from '@/lib/validations/template';
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
import { TemplateEditor } from './TemplateEditor';
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

interface TemplateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateTemplateInput) => Promise<void>;
  defaultValues?: Partial<CreateTemplateInput>;
  mode?: 'create' | 'edit';
}

export function TemplateForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  mode = 'create',
}: TemplateFormProps) {
  const [detectedVariables, setDetectedVariables] = useState<string[]>(
    defaultValues?.variables || []
  );
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(defaultValues?.tags || []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue,
  } = useForm<CreateTemplateInput>({
    resolver: zodResolver(createTemplateSchema),
    defaultValues: {
      name: '',
      description: '',
      platform: 'BLOG',
      content: '',
      isPublic: false,
      tags: [],
      variables: [],
      ...defaultValues,
    },
  });

  const platform = watch('platform');
  const content = watch('content');
  const isPublic = watch('isPublic');

  const onFormSubmit = async (data: CreateTemplateInput) => {
    const submitData = {
      ...data,
      variables: detectedVariables,
      tags,
    };
    await onSubmit(submitData);
    reset();
    setTags([]);
    setDetectedVariables([]);
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create Template' : 'Edit Template'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Create a reusable content template with dynamic variables.'
              : 'Update your template details and content.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name *</Label>
              <Input
                id="name"
                placeholder="Weekly Development Update"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

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
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of when to use this template..."
              rows={3}
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-red-600">{errors.description.message}</p>
            )}
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
                Public Template
              </Label>
              <p className="text-sm text-gray-600 mt-1">
                Make this template available to all users in your organization
              </p>
            </div>
            <Switch
              id="isPublic"
              checked={isPublic}
              onCheckedChange={(checked) => setValue('isPublic', checked)}
            />
          </div>

          {/* Template Content */}
          <div className="space-y-2">
            <Label>Template Content *</Label>
            <TemplateEditor
              content={content || ''}
              platform={platform}
              onChange={(newContent) => setValue('content', newContent)}
              onVariablesChange={setDetectedVariables}
              showValidation={true}
            />
            {errors.content && (
              <p className="text-sm text-red-600">{errors.content.message}</p>
            )}
          </div>

          {/* Detected Variables Info */}
          {detectedVariables.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm font-semibold text-blue-800 mb-2">
                Detected Variables ({detectedVariables.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {detectedVariables.map((variable) => (
                  <Badge key={variable} variant="secondary">
                    {`{{${variable}}}`}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-blue-600 mt-2">
                These variables will be replaced with dynamic content when the template is
                used.
              </p>
            </div>
          )}

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
                  ? 'Create Template'
                  : 'Update Template'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
