'use client';

/**
 * Prompt Editor Component
 * Edit system and user prompts with live quality scoring
 */

import { useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  Zap,
  TrendingUp,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PromptEditorProps {
  systemPrompt: string;
  userPrompt: string;
  onSystemPromptChange: (value: string) => void;
  onUserPromptChange: (value: string) => void;
  showQualityScore?: boolean;
}

interface QualityCheck {
  score: number;
  suggestions: string[];
}

export function PromptEditor({
  systemPrompt,
  userPrompt,
  onSystemPromptChange,
  onUserPromptChange,
  showQualityScore = true,
}: PromptEditorProps) {
  const [qualityCheck, setQualityCheck] = useState<QualityCheck>({
    score: 0,
    suggestions: [],
  });

  // Validate prompt quality (client-side approximation)
  useEffect(() => {
    let score = 100;
    const suggestions: string[] = [];

    // System prompt checks
    if (systemPrompt.length < 50) {
      score -= 15;
      suggestions.push('System prompt is very short. Consider adding more context and instructions.');
    }

    if (!systemPrompt.toLowerCase().includes('you are')) {
      score -= 10;
      suggestions.push('System prompt should define the AI\'s role (e.g., "You are a...")');
    }

    // User prompt checks
    if (userPrompt.length < 30) {
      score -= 15;
      suggestions.push('User prompt is very short. Add more specific instructions.');
    }

    if (!userPrompt.includes('{{') && !userPrompt.includes('}}')) {
      score -= 20;
      suggestions.push('User prompt doesn\'t use variables. Consider using {{variables}} for dynamic content.');
    }

    // Check for clear instructions
    const hasInstructions = /create|generate|write|compose|produce/i.test(userPrompt);
    if (!hasInstructions) {
      score -= 10;
      suggestions.push('Add clear action verbs (create, generate, write) to guide the AI.');
    }

    // Check for output format specification
    const hasFormat = /format|structure|markdown|html|json/i.test(systemPrompt + userPrompt);
    if (!hasFormat) {
      score -= 10;
      suggestions.push('Specify the desired output format (markdown, HTML, etc.)');
    }

    // Check for tone/style guidance
    const hasTone = /tone|style|voice|professional|casual|technical/i.test(systemPrompt);
    if (!hasTone) {
      score -= 5;
      suggestions.push('Consider specifying tone and style preferences.');
    }

    // Positive indicators
    if (systemPrompt.includes('example') || userPrompt.includes('example')) {
      score += 5;
    }

    if (systemPrompt.length > 200 && userPrompt.length > 100) {
      score += 5;
    }

    setQualityCheck({
      score: Math.max(0, Math.min(100, score)),
      suggestions,
    });
  }, [systemPrompt, userPrompt]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { variant: 'default' as const, icon: CheckCircle2, color: 'bg-green-50 text-green-700' };
    if (score >= 60) return { variant: 'secondary' as const, icon: TrendingUp, color: 'bg-yellow-50 text-yellow-700' };
    return { variant: 'destructive' as const, icon: AlertCircle, color: 'bg-red-50 text-red-700' };
  };

  const badge = getScoreBadge(qualityCheck.score);
  const BadgeIcon = badge.icon;

  return (
    <div className="space-y-6">
      {/* System Prompt */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="systemPrompt" className="text-base font-semibold">
            System Prompt *
          </Label>
          <Badge variant="outline" className="text-xs">
            {systemPrompt.length} chars
          </Badge>
        </div>
        <p className="text-sm text-gray-600">
          Define the AI's role, behavior, and overall context. This sets the foundation for
          how the AI will respond.
        </p>
        <Textarea
          id="systemPrompt"
          value={systemPrompt}
          onChange={(e) => onSystemPromptChange(e.target.value)}
          placeholder="You are a professional technical writer specializing in developer documentation..."
          rows={8}
          className="font-mono text-sm"
        />
      </div>

      {/* User Prompt */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="userPrompt" className="text-base font-semibold">
            User Prompt *
          </Label>
          <Badge variant="outline" className="text-xs">
            {userPrompt.length} chars
          </Badge>
        </div>
        <p className="text-sm text-gray-600">
          Specific instructions for the task. Use {`{{variableName}}`} for dynamic
          content that will be replaced at generation time.
        </p>
        <Textarea
          id="userPrompt"
          value={userPrompt}
          onChange={(e) => onUserPromptChange(e.target.value)}
          placeholder={`Write a comprehensive blog post about {{activity}}.\n\nInclude:\n1. Overview of changes\n2. Technical details\n3. Code examples\n4. Benefits and impact\n\nTone: Professional but approachable\nLength: 800-1200 words`}
          rows={12}
          className="font-mono text-sm"
        />
      </div>

      {/* Quality Score */}
      {showQualityScore && (
        <Card className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold">Prompt Quality Score</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold ${getScoreColor(qualityCheck.score)}`}>
                  {qualityCheck.score}
                </span>
                <span className="text-gray-400">/100</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{getScoreLabel(qualityCheck.score)}</span>
                <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${badge.color}`}>
                  <BadgeIcon className="w-3 h-3" />
                  <span className="text-xs font-semibold">{getScoreLabel(qualityCheck.score)}</span>
                </div>
              </div>
              <Progress
                value={qualityCheck.score}
                className="h-2"
              />
            </div>

            {/* Suggestions */}
            {qualityCheck.suggestions.length > 0 && (
              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold mb-2">Suggestions for improvement:</p>
                  <ul className="space-y-1 text-sm">
                    {qualityCheck.suggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-600 mt-0.5">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Positive feedback */}
            {qualityCheck.score >= 80 && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Excellent prompt quality! This prompt includes clear role definition,
                  specific instructions, and uses variables effectively.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </Card>
      )}

      {/* Token Estimation */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>Estimated tokens:</span>
        <Badge variant="outline">
          ~{Math.ceil((systemPrompt.length + userPrompt.length) / 4)}
        </Badge>
        <span className="text-xs text-gray-500">
          (Rough estimate: ~4 characters per token)
        </span>
      </div>
    </div>
  );
}
