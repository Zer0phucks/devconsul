"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

interface Step4BrandVoiceProps {
  onComplete: (data: { tone: string; audience: string; themes: string }) => void;
}

export function Step4BrandVoice({ onComplete }: Step4BrandVoiceProps) {
  const [tone, setTone] = useState("");
  const [audience, setAudience] = useState("");
  const [themes, setThemes] = useState("");

  const tones = [
    { value: "professional", label: "Professional", description: "Formal and business-oriented" },
    { value: "casual", label: "Casual", description: "Friendly and conversational" },
    { value: "technical", label: "Technical", description: "Detailed and developer-focused" },
    { value: "friendly", label: "Friendly", description: "Warm and approachable" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <Label className="text-lg font-semibold mb-4 block">
          1. What tone should your content have?
        </Label>
        <div className="grid md:grid-cols-2 gap-4">
          {tones.map((t) => (
            <div
              key={t.value}
              onClick={() => setTone(t.value)}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                tone === t.value
                  ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="font-medium mb-1">{t.label}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{t.description}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="audience" className="text-lg font-semibold mb-2 block">
          2. Who is your target audience?
        </Label>
        <Textarea
          id="audience"
          value={audience}
          onChange={(e) => setAudience(e.target.value)}
          placeholder="e.g., Software developers, startup founders, tech enthusiasts..."
          className="min-h-[100px]"
        />
      </div>

      <div>
        <Label htmlFor="themes" className="text-lg font-semibold mb-2 block">
          3. What key themes or topics do you cover?
        </Label>
        <Textarea
          id="themes"
          value={themes}
          onChange={(e) => setThemes(e.target.value)}
          placeholder="e.g., Web development, AI/ML, cloud infrastructure, open source..."
          className="min-h-[100px]"
        />
      </div>
    </div>
  );
}
