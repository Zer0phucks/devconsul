'use client';

/**
 * Regenerate Modal - AI content regeneration with refinement
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles, Copy } from 'lucide-react';

interface RegenerateModalProps {
  open: boolean;
  onClose: () => void;
  currentContent: string;
  contentId: string;
  onRegenerate: (options: RegenerateOptions) => Promise<string[]>;
  estimatedCost?: number;
}

interface RegenerateOptions {
  refinementPrompt?: string;
  keepPrevious: boolean;
  generateVariations: boolean;
  variationCount: number;
  aiModel: 'gpt-3.5-turbo' | 'gpt-4' | 'claude-3-sonnet';
}

export function RegenerateModal({
  open,
  onClose,
  currentContent,
  onRegenerate,
  estimatedCost = 0.003,
}: RegenerateModalProps) {
  const [refinementPrompt, setRefinementPrompt] = useState('');
  const [keepPrevious, setKeepPrevious] = useState(false);
  const [generateVariations, setGenerateVariations] = useState(false);
  const [variationCount, setVariationCount] = useState(3);
  const [aiModel, setAiModel] = useState<'gpt-3.5-turbo' | 'gpt-4' | 'claude-3-sonnet'>('gpt-4');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [newContent, setNewContent] = useState<string[]>([]);
  const [selectedVariation, setSelectedVariation] = useState(0);

  // Suggested refinement prompts
  const suggestedPrompts = [
    'Make it shorter',
    'Add more details',
    'Change tone to professional',
    'Include code examples',
    'Make it more casual',
    'Add statistics and data',
  ];

  // Handle refinement prompt chip click
  const handlePromptChipClick = (prompt: string) => {
    setRefinementPrompt(refinementPrompt ? `${refinementPrompt} ${prompt}` : prompt);
  };

  // Handle regeneration
  const handleRegenerate = async () => {
    setIsRegenerating(true);
    setNewContent([]);

    try {
      const options: RegenerateOptions = {
        refinementPrompt: refinementPrompt || undefined,
        keepPrevious,
        generateVariations,
        variationCount: generateVariations ? variationCount : 1,
        aiModel,
      };

      const results = await onRegenerate(options);
      setNewContent(results);
      setSelectedVariation(0);
    } catch (error) {
      console.error('Regeneration failed:', error);
      alert('Failed to regenerate content');
    } finally {
      setIsRegenerating(false);
    }
  };

  // Copy to clipboard
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Regenerate Content</DialogTitle>
        </DialogHeader>

        {!newContent.length ? (
          // Regeneration form
          <div className="space-y-6">
            {/* Current content preview */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Current Content Preview
              </Label>
              <div className="bg-gray-50 border rounded-lg p-4 max-h-40 overflow-y-auto">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {currentContent.substring(0, 500)}
                  {currentContent.length > 500 && '...'}
                </p>
              </div>
            </div>

            {/* Refinement instructions */}
            <div>
              <Label htmlFor="refinement" className="text-sm font-medium mb-2 block">
                Refinement Instructions (optional)
              </Label>
              <Textarea
                id="refinement"
                value={refinementPrompt}
                onChange={(e) => setRefinementPrompt(e.target.value)}
                placeholder="e.g., Make it more technical, add examples, change tone..."
                maxLength={200}
                rows={3}
                className="resize-none"
              />
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-500">
                  {refinementPrompt.length} / 200 characters
                </span>
              </div>

              {/* Suggested prompts */}
              <div className="mt-3 flex flex-wrap gap-2">
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handlePromptChipClick(prompt)}
                    className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full text-xs transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Options</Label>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="keep-previous"
                  checked={keepPrevious}
                  onCheckedChange={(checked) => setKeepPrevious(checked as boolean)}
                />
                <Label htmlFor="keep-previous" className="text-sm cursor-pointer">
                  Keep previous version (create new version)
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="variations"
                  checked={generateVariations}
                  onCheckedChange={(checked) =>
                    setGenerateVariations(checked as boolean)
                  }
                />
                <Label htmlFor="variations" className="text-sm cursor-pointer">
                  Generate multiple variations
                </Label>
              </div>

              {generateVariations && (
                <div className="ml-6 space-y-2">
                  <Label htmlFor="variation-count" className="text-sm">
                    Number of variations:
                  </Label>
                  <Select
                    value={variationCount.toString()}
                    onValueChange={(v) => setVariationCount(parseInt(v))}
                  >
                    <SelectTrigger id="variation-count" className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2</SelectItem>
                      <SelectItem value="3">3</SelectItem>
                      <SelectItem value="4">4</SelectItem>
                      <SelectItem value="5">5</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="ai-model" className="text-sm">
                  AI Model:
                </Label>
                <Select value={aiModel} onValueChange={(v) => setAiModel(v as typeof aiModel)}>
                  <SelectTrigger id="ai-model" className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                    <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-gray-600">
                Estimated cost:{' '}
                <span className="font-semibold">
                  $
                  {(
                    estimatedCost * (generateVariations ? variationCount : 1)
                  ).toFixed(4)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={onClose} disabled={isRegenerating}>
                  Cancel
                </Button>
                <Button onClick={handleRegenerate} disabled={isRegenerating}>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isRegenerating ? 'Regenerating...' : 'Regenerate'}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Regeneration results
          <div className="space-y-6">
            {/* Results navigation */}
            {newContent.length > 1 && (
              <div className="flex items-center justify-center gap-2">
                {newContent.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedVariation(index)}
                    className={`px-3 py-1 rounded-md text-sm transition-colors ${
                      selectedVariation === index
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    Variation {index + 1}
                  </button>
                ))}
              </div>
            )}

            {/* Side-by-side comparison */}
            <div className="grid grid-cols-2 gap-4">
              {/* Original */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Original</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(currentContent)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <div className="bg-gray-50 border rounded-lg p-4 max-h-96 overflow-y-auto">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {currentContent}
                  </p>
                </div>
              </div>

              {/* New */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">New Version</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(newContent[selectedVariation])}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {newContent[selectedVariation]}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button variant="outline" onClick={() => setNewContent([])}>
                Try Again
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  // TODO: Save selected variation
                  onClose();
                }}>
                  Use This Version
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
