'use client';

/**
 * Adaptation Controls Component
 * Configure transformation settings and preview adaptations
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import type { Platform } from '@/lib/ai/generator';

export interface AdaptationSettings {
  targetPlatforms: Platform[];
  shortenLinks: boolean;
  addHashtags: boolean;
  generateHashtags: boolean;
  hashtags: string[];
  tone: 'professional' | 'casual' | 'technical' | 'friendly';
  linkShortener: 'bitly' | 'tinyurl' | 'custom';
  customShortenerEndpoint?: string;
  addUTM: boolean;
  utmSource?: string;
  utmCampaign?: string;
}

export interface AdaptationControlsProps {
  onSettingsChange: (settings: AdaptationSettings) => void;
  onTransform: () => void;
  isTransforming?: boolean;
}

export function AdaptationControls({
  onSettingsChange,
  onTransform,
  isTransforming = false,
}: AdaptationControlsProps) {
  const [settings, setSettings] = useState<AdaptationSettings>({
    targetPlatforms: ['twitter', 'linkedin', 'facebook', 'reddit'],
    shortenLinks: true,
    addHashtags: true,
    generateHashtags: false,
    hashtags: [],
    tone: 'professional',
    linkShortener: 'tinyurl',
    addUTM: true,
  });

  const [customHashtag, setCustomHashtag] = useState('');

  const updateSettings = (updates: Partial<AdaptationSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const togglePlatform = (platform: Platform) => {
    const platforms = settings.targetPlatforms.includes(platform)
      ? settings.targetPlatforms.filter((p) => p !== platform)
      : [...settings.targetPlatforms, platform];
    updateSettings({ targetPlatforms: platforms });
  };

  const addHashtag = () => {
    if (customHashtag.trim()) {
      const hashtag = customHashtag.startsWith('#')
        ? customHashtag
        : `#${customHashtag}`;
      updateSettings({
        hashtags: [...settings.hashtags, hashtag],
      });
      setCustomHashtag('');
    }
  };

  const removeHashtag = (index: number) => {
    updateSettings({
      hashtags: settings.hashtags.filter((_, i) => i !== index),
    });
  };

  const allPlatforms: Platform[] = [
    'blog',
    'email',
    'twitter',
    'linkedin',
    'facebook',
    'reddit',
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Adaptation Settings</CardTitle>
        <CardDescription>
          Configure how content should be transformed for each platform
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Target Platforms */}
        <div className="space-y-3">
          <Label>Target Platforms</Label>
          <div className="grid grid-cols-2 gap-2">
            {allPlatforms.map((platform) => (
              <div key={platform} className="flex items-center space-x-2">
                <Switch
                  id={`platform-${platform}`}
                  checked={settings.targetPlatforms.includes(platform)}
                  onCheckedChange={() => togglePlatform(platform)}
                />
                <Label
                  htmlFor={`platform-${platform}`}
                  className="capitalize cursor-pointer"
                >
                  {platform}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Tone Selection */}
        <div className="space-y-2">
          <Label htmlFor="tone">Content Tone</Label>
          <Select
            value={settings.tone}
            onValueChange={(value: any) => updateSettings({ tone: value })}
          >
            <SelectTrigger id="tone">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="casual">Casual</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
              <SelectItem value="friendly">Friendly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Link Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Shorten Links</Label>
              <p className="text-sm text-gray-500">
                Automatically shorten URLs for social media
              </p>
            </div>
            <Switch
              checked={settings.shortenLinks}
              onCheckedChange={(checked) => updateSettings({ shortenLinks: checked })}
            />
          </div>

          {settings.shortenLinks && (
            <div className="space-y-2 ml-6">
              <Label htmlFor="shortener">Link Shortener</Label>
              <Select
                value={settings.linkShortener}
                onValueChange={(value: any) =>
                  updateSettings({ linkShortener: value })
                }
              >
                <SelectTrigger id="shortener">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tinyurl">TinyURL (Free)</SelectItem>
                  <SelectItem value="bitly">Bit.ly (API Key Required)</SelectItem>
                  <SelectItem value="custom">Custom Endpoint</SelectItem>
                </SelectContent>
              </Select>

              {settings.linkShortener === 'custom' && (
                <Input
                  placeholder="https://your-shortener.com/api/shorten"
                  value={settings.customShortenerEndpoint || ''}
                  onChange={(e) =>
                    updateSettings({ customShortenerEndpoint: e.target.value })
                  }
                />
              )}
            </div>
          )}
        </div>

        {/* UTM Tracking */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Add UTM Parameters</Label>
              <p className="text-sm text-gray-500">
                Track link clicks with UTM parameters
              </p>
            </div>
            <Switch
              checked={settings.addUTM}
              onCheckedChange={(checked) => updateSettings({ addUTM: checked })}
            />
          </div>

          {settings.addUTM && (
            <div className="space-y-2 ml-6">
              <div>
                <Label htmlFor="utm-source">UTM Source</Label>
                <Input
                  id="utm-source"
                  placeholder="e.g., newsletter, blog"
                  value={settings.utmSource || ''}
                  onChange={(e) => updateSettings({ utmSource: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="utm-campaign">UTM Campaign</Label>
                <Input
                  id="utm-campaign"
                  placeholder="e.g., launch, announcement"
                  value={settings.utmCampaign || ''}
                  onChange={(e) => updateSettings({ utmCampaign: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>

        {/* Hashtag Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Add Hashtags</Label>
              <p className="text-sm text-gray-500">
                Include hashtags in transformed content
              </p>
            </div>
            <Switch
              checked={settings.addHashtags}
              onCheckedChange={(checked) => updateSettings({ addHashtags: checked })}
            />
          </div>

          {settings.addHashtags && (
            <div className="space-y-3 ml-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="generate-hashtags"
                  checked={settings.generateHashtags}
                  onCheckedChange={(checked) =>
                    updateSettings({ generateHashtags: checked })
                  }
                />
                <Label htmlFor="generate-hashtags">
                  Auto-generate from content
                </Label>
              </div>

              <div className="space-y-2">
                <Label>Custom Hashtags</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter hashtag (e.g., #webdev)"
                    value={customHashtag}
                    onChange={(e) => setCustomHashtag(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addHashtag();
                      }
                    }}
                  />
                  <Button onClick={addHashtag} type="button">
                    Add
                  </Button>
                </div>

                {settings.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {settings.hashtags.map((hashtag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        {hashtag}
                        <button
                          onClick={() => removeHashtag(index)}
                          className="hover:text-blue-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Transform Button */}
        <Button
          onClick={onTransform}
          disabled={isTransforming || settings.targetPlatforms.length === 0}
          className="w-full"
          size="lg"
        >
          {isTransforming ? 'Transforming...' : 'Transform Content'}
        </Button>
      </CardContent>
    </Card>
  );
}
