"use client";

/**
 * Step 6: Generate Test Content
 * AI content generation demonstration with preview and regeneration
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles,
  Loader2,
  RefreshCw,
  CheckCircle2,
  Edit3,
  Eye,
} from "lucide-react";

interface Step6Data {
  contentId?: string;
  accepted: boolean;
  regenerated: number;
}

interface Step6TestContentProps {
  onComplete: (data: Step6Data) => Promise<boolean>;
}

export function Step6TestContent({ onComplete }: Step6TestContentProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [regenerateCount, setRegenerateCount] = useState(0);
  const [progress, setProgress] = useState(0);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgress(0);

    try {
      // Simulate AI generation with progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Simulate content generation (in production, this would call AI API)
      await new Promise(resolve => setTimeout(resolve, 2000));

      clearInterval(progressInterval);
      setProgress(100);

      const mockContent = `# Exciting Updates from Our Latest Release

We're thrilled to announce the latest features and improvements in our platform! This week brought significant enhancements that make your workflow even more efficient.

## Key Features

### Enhanced Performance
We've optimized the core engine, resulting in 40% faster processing times. Your content now generates in seconds, not minutes.

### Smart Suggestions
Our AI now provides intelligent recommendations based on your writing style and audience preferences. Simply start typing, and watch the magic happen!

### Seamless Integration
Connect with your favorite platforms effortlessly. We've streamlined the OAuth flow and added support for batch publishing.

## What's Next?

We're already working on the next release with even more exciting features:
- Advanced analytics dashboard
- Team collaboration tools
- Custom scheduling workflows

Try these features today and let us know what you think!

---

*Generated with AI • Ready to publish*`;

      setGeneratedContent(mockContent);
      setEditedContent(mockContent);
    } catch (error) {
      console.error("Generation error:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    setRegenerateCount((prev) => prev + 1);
    await handleGenerate();
  };

  const handleAccept = async () => {
    await onComplete({
      contentId: "mock-content-id",
      accepted: true,
      regenerated: regenerateCount,
    });
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    setGeneratedContent(editedContent);
    setIsEditing(false);
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">See AI Content Generation in Action</h2>
        <p className="text-muted-foreground text-lg">
          Generate a sample post to experience the power of AI-driven content
        </p>
      </div>

      {!generatedContent ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-6">
          <div className="text-center space-y-4 max-w-md">
            <div className="bg-gradient-to-br from-purple-100 to-blue-100 p-8 rounded-full inline-block">
              <Sparkles className="h-16 w-16 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold">Ready to Generate Content?</h3>
            <p className="text-muted-foreground">
              Click below to generate a sample blog post based on your brand voice and preferences
            </p>
          </div>

          <Button
            size="lg"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-8"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating Content... ({progress}%)
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Generate Test Content
              </>
            )}
          </Button>

          {isGenerating && (
            <div className="w-full max-w-md">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-center text-muted-foreground mt-2">
                Analyzing your preferences and generating content...
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-900">Content Generated Successfully!</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Regenerate
                  </>
                )}
              </Button>
              {!isEditing ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleEdit}
                >
                  <Edit3 className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveEdit}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Save
                </Button>
              )}
            </div>
          </div>

          <Card className="p-6">
            {isEditing ? (
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                rows={20}
                className="font-mono text-sm"
              />
            ) : (
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap font-serif text-gray-800">
                  {generatedContent}
                </div>
              </div>
            )}
          </Card>

          {regenerateCount > 0 && (
            <div className="text-sm text-muted-foreground text-center">
              Regenerated {regenerateCount} time{regenerateCount > 1 ? "s" : ""}
            </div>
          )}

          <div className="flex justify-center gap-4 pt-4">
            <Button
              size="lg"
              onClick={handleAccept}
              className="px-8"
            >
              <CheckCircle2 className="mr-2 h-5 w-5" />
              Accept & Continue
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleRegenerate}
              disabled={isGenerating}
            >
              <RefreshCw className="mr-2 h-5 w-5" />
              Try Again
            </Button>
          </div>

          <div className="text-center space-y-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-900">
              <Eye className="inline h-4 w-4 mr-1" />
              This is just a preview! You can edit any generated content before publishing.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
