"use client";

/**
 * Onboarding Step 1: Welcome Screen
 * Introduction to the platform with feature highlights
 */

import { useState } from "react";
import { Button } from "@/components/ui/card";
import {
  Zap,
  Calendar,
  BarChart3,
  Sparkles,
  Github,
  Globe,
  CheckCircle2
} from "lucide-react";

interface Step1WelcomeProps {
  onComplete: (data: { videoWatched?: boolean }) => void;
}

export function Step1Welcome({ onComplete }: Step1WelcomeProps) {
  const [videoWatched, setVideoWatched] = useState(false);

  const features = [
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: "AI Content Generation",
      description: "Automatically create blog posts, newsletters, and social media content from your GitHub activity",
    },
    {
      icon: <Calendar className="w-6 h-6" />,
      title: "Smart Scheduling",
      description: "Schedule content across multiple platforms with conflict detection and optimization",
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: "Analytics & Insights",
      description: "Track performance, engagement, and repository insights all in one place",
    },
    {
      icon: <Github className="w-6 h-6" />,
      title: "GitHub Integration",
      description: "Sync with your repositories and turn code commits into engaging content",
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Multi-Platform Publishing",
      description: "Publish to Hashnode, Dev.to, Medium, LinkedIn, Twitter, and more",
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Automation & Workflows",
      description: "Set up automated workflows with customizable templates and brand voice",
    },
  ];

  const handleGetStarted = () => {
    onComplete({ videoWatched });
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Automate Your Content Publishing
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Full Self Publishing turns your GitHub activity into engaging content across all your platforms.
          Let's get you set up in just a few minutes!
        </p>
      </div>

      {/* Video/Animation Placeholder */}
      <div className="bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-8 text-center">
        <div className="aspect-video bg-white dark:bg-gray-800 rounded-lg shadow-lg flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-500 rounded-full">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.841z" />
              </svg>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Watch our 2-minute introduction video
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setVideoWatched(true)}
            >
              {videoWatched ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                  Watched
                </>
              ) : (
                "Play Video"
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <div
            key={index}
            className="p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400 mb-4">
              {feature.icon}
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              {feature.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
        <div className="grid md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold">10+</div>
            <div className="text-sm opacity-90">Supported Platforms</div>
          </div>
          <div>
            <div className="text-3xl font-bold">5min</div>
            <div className="text-sm opacity-90">Average Setup Time</div>
          </div>
          <div>
            <div className="text-3xl font-bold">24/7</div>
            <div className="text-sm opacity-90">Automated Publishing</div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center pt-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Ready to automate your content workflow? Let's begin!
        </p>
      </div>
    </div>
  );
}
