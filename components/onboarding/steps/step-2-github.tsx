"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Github, ExternalLink } from "lucide-react";

interface Step2GitHubProps {
  onComplete: (data: { repoId?: string; repoName?: string; skipped: boolean }) => void;
}

export function Step2GitHub({ onComplete }: Step2GitHubProps) {
  const [selectedRepo, setSelectedRepo] = useState<string | null>(null);

  const handleConnect = async () => {
    // Redirect to GitHub OAuth
    window.location.href = "/api/auth/github/connect";
  };

  const handleSkip = () => {
    onComplete({ skipped: true });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-900 dark:bg-white rounded-full">
          <Github className="w-8 h-8 text-white dark:text-gray-900" />
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Connect Your GitHub Repository</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Link your repository to automatically generate content from your commits, PRs, and releases
          </p>
        </div>
      </div>

      <Card className="p-6 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs">✓</span>
            </div>
            <div>
              <p className="font-medium">Track code activity</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Monitor commits, PRs, and issues</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs">✓</span>
            </div>
            <div>
              <p className="font-medium">Auto-generate content</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Create posts from repository updates</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs">✓</span>
            </div>
            <div>
              <p className="font-medium">Publish automatically</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Share updates on your platforms</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="text-center">
        <Button onClick={handleConnect} size="lg" className="w-full md:w-auto">
          <Github className="w-5 h-5 mr-2" />
          Connect with GitHub
          <ExternalLink className="w-4 h-4 ml-2" />
        </Button>
        <p className="text-xs text-gray-500 mt-2">
          We only request read access to public repositories
        </p>
      </div>
    </div>
  );
}
