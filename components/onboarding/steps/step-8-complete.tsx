"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, ArrowRight, BookOpen, BarChart3, Calendar } from "lucide-react";

interface Step8CompleteProps {
  onStartTour: () => void;
  onGoToDashboard: () => void;
}

export function Step8Complete({ onStartTour, onGoToDashboard }: Step8CompleteProps) {
  return (
    <div className="space-y-8 text-center">
      <div className="space-y-4">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full">
          <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-3xl font-bold">Setup Complete!</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Your Full Self Publishing platform is ready to go. Here's what you can do now:
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="p-6">
          <BookOpen className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-4 mx-auto" />
          <h3 className="font-semibold mb-2">View Content</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Check your generated content and make edits
          </p>
        </Card>
        <Card className="p-6">
          <Calendar className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-4 mx-auto" />
          <h3 className="font-semibold mb-2">Schedule Posts</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Set up automated publishing schedules
          </p>
        </Card>
        <Card className="p-6">
          <BarChart3 className="w-8 h-8 text-purple-600 dark:text-purple-400 mb-4 mx-auto" />
          <h3 className="font-semibold mb-2">Track Analytics</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Monitor performance and engagement
          </p>
        </Card>
      </div>

      <div className="space-y-4">
        <Button onClick={onStartTour} size="lg" className="w-full md:w-auto">
          Take a Quick Tour
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        <div>
          <Button onClick={onGoToDashboard} variant="outline" size="lg" className="w-full md:w-auto">
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
