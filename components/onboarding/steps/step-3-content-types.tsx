"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { BookOpen, Mail, Twitter, Linkedin, Facebook, Rss } from "lucide-react";

const CONTENT_TYPES = [
  { id: "blog", icon: BookOpen, title: "Blog Posts", description: "Technical articles and tutorials" },
  { id: "newsletter", icon: Mail, title: "Newsletter", description: "Weekly/monthly email updates" },
  { id: "twitter", icon: Twitter, title: "Twitter/X", description: "Short updates and threads" },
  { id: "linkedin", icon: Linkedin, title: "LinkedIn", description: "Professional posts and articles" },
  { id: "facebook", icon: Facebook, title: "Facebook", description: "Community updates" },
  { id: "rss", icon: Rss, title: "RSS Feed", description: "Syndicated content feed" },
];

interface Step3ContentTypesProps {
  onComplete: (data: { selectedTypes: string[] }) => void;
}

export function Step3ContentTypes({ onComplete }: Step3ContentTypesProps) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggleType = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-gray-600 dark:text-gray-400">
          Select the types of content you want to publish (choose at least one)
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CONTENT_TYPES.map((type) => (
          <Card
            key={type.id}
            className={`p-6 cursor-pointer transition-all ${
              selected.includes(type.id)
                ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                : "hover:border-gray-300"
            }`}
            onClick={() => toggleType(type.id)}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-lg ${
                selected.includes(type.id)
                  ? "bg-purple-500 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
              }`}>
                <type.icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">{type.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{type.description}</p>
              </div>
              {selected.includes(type.id) && (
                <div className="text-purple-500">✓</div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <div className="text-center text-sm text-gray-500">
        Selected: {selected.length} type{selected.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
