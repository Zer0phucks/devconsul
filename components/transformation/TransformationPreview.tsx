'use client';

/**
 * Transformation Preview Component
 * Side-by-side comparison of original vs adapted content
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { TransformedContent } from '@/lib/transformation/engine';
import type { Platform } from '@/lib/ai/generator';

export interface TransformationPreviewProps {
  originalContent: string;
  transformedContent: Record<Platform, TransformedContent>;
  onEdit?: (platform: Platform, content: string) => void;
  onApprove?: (platform: Platform) => void;
  onRegenerate?: (platform: Platform) => void;
}

export function TransformationPreview({
  originalContent,
  transformedContent,
  onEdit,
  onApprove,
  onRegenerate,
}: TransformationPreviewProps) {
  const [editingPlatform, setEditingPlatform] = useState<Platform | null>(null);
  const [editedContent, setEditedContent] = useState<Record<string, string>>({});

  const platforms = Object.keys(transformedContent) as Platform[];

  const handleEdit = (platform: Platform) => {
    setEditingPlatform(platform);
    setEditedContent({
      ...editedContent,
      [platform]: transformedContent[platform].content,
    });
  };

  const handleSaveEdit = (platform: Platform) => {
    if (onEdit && editedContent[platform]) {
      onEdit(platform, editedContent[platform]);
    }
    setEditingPlatform(null);
  };

  const handleCancelEdit = () => {
    setEditingPlatform(null);
  };

  const getQualityBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Original Content */}
      <Card>
        <CardHeader>
          <CardTitle>Original Content</CardTitle>
          <CardDescription>Source content before transformation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <div className="whitespace-pre-wrap text-sm">{originalContent}</div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <span>Length: {originalContent.length} characters</span>
          </div>
        </CardContent>
      </Card>

      {/* Transformed Content Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Transformed Content</CardTitle>
          <CardDescription>
            Platform-specific adaptations with quality scores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={platforms[0]} className="w-full">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-6">
              {platforms.map((platform) => (
                <TabsTrigger key={platform} value={platform}>
                  <span className="capitalize">{platform}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {platforms.map((platform) => {
              const transformed = transformedContent[platform];
              const isEditing = editingPlatform === platform;

              return (
                <TabsContent key={platform} value={platform} className="space-y-4">
                  {/* Metadata */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      className={`${getQualityBadgeColor(transformed.metadata.qualityScore)} text-white`}
                    >
                      Quality: {transformed.metadata.qualityScore}%
                    </Badge>
                    <Badge variant="outline">
                      {transformed.metadata.transformationType}
                    </Badge>
                    <Badge variant="outline">
                      {transformed.content.length} chars
                    </Badge>
                    {transformed.metadata.aiModel && (
                      <Badge variant="secondary">{transformed.metadata.aiModel}</Badge>
                    )}
                  </div>

                  {/* Warnings */}
                  {transformed.warnings && transformed.warnings.length > 0 && (
                    <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
                      <p className="text-sm font-medium text-yellow-800 mb-1">
                        Warnings:
                      </p>
                      <ul className="text-sm text-yellow-700 list-disc list-inside space-y-1">
                        {transformed.warnings.map((warning, idx) => (
                          <li key={idx}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Key Points Preserved */}
                  {transformed.metadata.keyPointsPreserved.length > 0 && (
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
                      <p className="text-sm font-medium text-blue-800 mb-2">
                        Key Points Preserved:
                      </p>
                      <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                        {transformed.metadata.keyPointsPreserved.map((point, idx) => (
                          <li key={idx}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Content */}
                  <div className="border rounded-lg p-4 bg-gray-50">
                    {isEditing ? (
                      <textarea
                        className="w-full min-h-[200px] p-3 border rounded font-mono text-sm"
                        value={editedContent[platform] || transformed.content}
                        onChange={(e) =>
                          setEditedContent({
                            ...editedContent,
                            [platform]: e.target.value,
                          })
                        }
                      />
                    ) : (
                      <div className="whitespace-pre-wrap text-sm">
                        {transformed.content}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <Button
                          onClick={() => handleSaveEdit(platform)}
                          size="sm"
                          variant="default"
                        >
                          Save Changes
                        </Button>
                        <Button
                          onClick={handleCancelEdit}
                          size="sm"
                          variant="outline"
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        {onEdit && (
                          <Button
                            onClick={() => handleEdit(platform)}
                            size="sm"
                            variant="outline"
                          >
                            Edit
                          </Button>
                        )}
                        {onApprove && (
                          <Button
                            onClick={() => onApprove(platform)}
                            size="sm"
                            variant="default"
                          >
                            Approve
                          </Button>
                        )}
                        {onRegenerate && (
                          <Button
                            onClick={() => onRegenerate(platform)}
                            size="sm"
                            variant="secondary"
                          >
                            Regenerate
                          </Button>
                        )}
                        <Button
                          onClick={() => {
                            navigator.clipboard.writeText(transformed.content);
                          }}
                          size="sm"
                          variant="ghost"
                        >
                          Copy
                        </Button>
                      </>
                    )}
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
