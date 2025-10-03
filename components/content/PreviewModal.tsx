'use client';

/**
 * Preview Modal - Platform-specific content preview with metadata
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatContent, type Platform } from '@/lib/content/formatters';
import type { FormattedContent } from '@/lib/content/formatters';
import { Copy, Edit, RotateCw, Send, Smartphone, Monitor } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';

interface PreviewModalProps {
  open: boolean;
  onClose: () => void;
  content: string;
  title?: string;
  defaultPlatform?: Platform;
  onEdit?: () => void;
  onRegenerate?: () => void;
  onPublish?: () => void;
  metadata?: {
    aiModel?: string;
    cost?: number;
  };
}

export function PreviewModal({
  open,
  onClose,
  content,
  title = 'Content Preview',
  defaultPlatform = 'blog',
  onEdit,
  onRegenerate,
  onPublish,
  metadata,
}: PreviewModalProps) {
  const [platform, setPlatform] = useState<Platform>(defaultPlatform);
  const [formatted, setFormatted] = useState<FormattedContent | null>(null);
  const [deviceView, setDeviceView] = useState<'mobile' | 'desktop'>('desktop');
  const [copying, setCopying] = useState(false);

  // Format content when platform changes
  useEffect(() => {
    if (!content) return;

    formatContent(content, platform).then(setFormatted);
  }, [content, platform]);

  // Copy to clipboard
  const handleCopy = async () => {
    if (!formatted) return;

    try {
      await navigator.clipboard.writeText(formatted.plainText);
      setCopying(true);
      setTimeout(() => setCopying(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Render platform-specific preview
  const renderPreview = () => {
    if (!formatted) {
      return <div className="animate-pulse bg-gray-100 h-96 rounded" />;
    }

    const containerClass =
      deviceView === 'mobile' ? 'max-w-sm mx-auto' : 'max-w-full';

    switch (platform) {
      case 'blog':
        return (
          <div className={`prose prose-sm max-w-none ${containerClass}`}>
            <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
              {content}
            </ReactMarkdown>
          </div>
        );

      case 'email':
        return (
          <div
            className={`border rounded-lg p-4 ${containerClass}`}
            style={{ fontFamily: 'system-ui, sans-serif' }}
            dangerouslySetInnerHTML={{ __html: formatted.html }}
          />
        );

      case 'twitter':
        return (
          <div className={`space-y-3 ${containerClass}`}>
            {formatted.plainText.split('\n\n').map((tweet, i) => (
              <div
                key={i}
                className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                    U
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">Your Name</div>
                    <div className="text-gray-500 text-sm">@username</div>
                    <p className="mt-2 whitespace-pre-wrap">{tweet}</p>
                    <div className="mt-3 text-xs text-gray-500">
                      {tweet.length} / 280 characters
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'linkedin':
        return (
          <div className={`border rounded-lg bg-white shadow-sm ${containerClass}`}>
            <div className="p-4 border-b flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-lg">
                U
              </div>
              <div>
                <div className="font-semibold">Your Name</div>
                <div className="text-sm text-gray-600">Professional Title</div>
                <div className="text-xs text-gray-500">Just now</div>
              </div>
            </div>
            <div className="p-4 whitespace-pre-wrap">{formatted.plainText}</div>
          </div>
        );

      case 'facebook':
        return (
          <div className={`border rounded-lg bg-white shadow-sm ${containerClass}`}>
            <div className="p-4 border-b flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                U
              </div>
              <div>
                <div className="font-semibold">Your Name</div>
                <div className="text-xs text-gray-500">Just now · 🌎</div>
              </div>
            </div>
            <div className="p-4 whitespace-pre-wrap">{formatted.plainText}</div>
          </div>
        );

      case 'reddit':
        return (
          <div className={`border rounded-lg bg-white ${containerClass}`}>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold text-sm">
                  u
                </div>
                <span className="text-sm font-medium">u/username</span>
                <span className="text-xs text-gray-500">• just now</span>
              </div>
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                  {content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div
            className={containerClass}
            dangerouslySetInnerHTML={{ __html: formatted.html }}
          />
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>{title}</DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            ×
          </Button>
        </DialogHeader>

        <div className="flex items-center gap-4 py-2 border-b">
          {/* Platform selector */}
          <Select value={platform} onValueChange={(v) => setPlatform(v as Platform)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="blog">Blog</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="twitter">Twitter</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="reddit">Reddit</SelectItem>
            </SelectContent>
          </Select>

          {/* Device view toggle */}
          {['email', 'blog'].includes(platform) && (
            <div className="flex items-center gap-1 border rounded-md p-1">
              <Button
                variant={deviceView === 'desktop' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDeviceView('desktop')}
              >
                <Monitor className="w-4 h-4" />
              </Button>
              <Button
                variant={deviceView === 'mobile' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setDeviceView('mobile')}
              >
                <Smartphone className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-hidden grid grid-cols-3 gap-4">
          {/* Preview area */}
          <div className="col-span-2 overflow-y-auto p-4 bg-gray-50 rounded-lg">
            {renderPreview()}
          </div>

          {/* Metadata sidebar */}
          <div className="border-l pl-4 space-y-4">
            <div>
              <h3 className="font-semibold text-sm mb-2">Metadata</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Characters:</span>
                  <span className="font-medium">
                    {formatted?.metadata.characterCount || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Words:</span>
                  <span className="font-medium">
                    {formatted?.metadata.wordCount || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Read time:</span>
                  <span className="font-medium">
                    {formatted?.metadata.readTime || 0} min
                  </span>
                </div>
                {formatted?.metadata.tweetCount && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tweets:</span>
                    <span className="font-medium">
                      {formatted.metadata.tweetCount}
                    </span>
                  </div>
                )}
                {metadata?.aiModel && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Model:</span>
                    <span className="font-medium text-xs">{metadata.aiModel}</span>
                  </div>
                )}
                {metadata?.cost && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cost:</span>
                    <span className="font-medium">${metadata.cost.toFixed(4)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            {onEdit && (
              <Button variant="outline" onClick={onEdit}>
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
            <Button variant="outline" onClick={handleCopy} disabled={copying}>
              <Copy className="w-4 h-4 mr-2" />
              {copying ? 'Copied!' : 'Copy'}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {onRegenerate && (
              <Button variant="outline" onClick={onRegenerate}>
                <RotateCw className="w-4 h-4 mr-2" />
                Regenerate
              </Button>
            )}
            {onPublish && (
              <Button onClick={onPublish}>
                <Send className="w-4 h-4 mr-2" />
                Publish
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
