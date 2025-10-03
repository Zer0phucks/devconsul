"use client";

/**
 * Step 5: Connect 1-2 Platforms
 * Platform OAuth connection UI with platform selection and connection status
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Twitter,
  Linkedin,
  Facebook,
  FileText,
  Mail,
  CheckCircle2,
  Loader2,
  ExternalLink,
} from "lucide-react";

interface Step5Data {
  platforms: Array<{
    type: string;
    connected: boolean;
  }>;
  skipped: boolean;
}

interface Step5PlatformsProps {
  onComplete: (data: Step5Data) => Promise<boolean>;
}

const PLATFORMS = [
  {
    id: "hashnode",
    name: "Hashnode",
    icon: FileText,
    description: "Developer blogging platform",
    color: "bg-blue-500",
    comingSoon: false,
  },
  {
    id: "devto",
    name: "Dev.to",
    icon: FileText,
    description: "Community for developers",
    color: "bg-gray-800",
    comingSoon: false,
  },
  {
    id: "medium",
    name: "Medium",
    icon: FileText,
    description: "Publishing platform",
    color: "bg-black",
    comingSoon: false,
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: Linkedin,
    description: "Professional network",
    color: "bg-blue-600",
    comingSoon: false,
  },
  {
    id: "twitter",
    name: "Twitter/X",
    icon: Twitter,
    description: "Social media platform",
    color: "bg-sky-500",
    comingSoon: false,
  },
  {
    id: "newsletter",
    name: "Newsletter",
    icon: Mail,
    description: "Email newsletter via Resend",
    color: "bg-purple-500",
    comingSoon: false,
  },
] as const;

export function Step5Platforms({ onComplete }: Step5PlatformsProps) {
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set());
  const [connectedPlatforms, setConnectedPlatforms] = useState<Set<string>>(new Set());
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);

  const handlePlatformSelect = (platformId: string) => {
    const newSelected = new Set(selectedPlatforms);
    if (newSelected.has(platformId)) {
      newSelected.delete(platformId);
      // Also remove from connected if deselected
      const newConnected = new Set(connectedPlatforms);
      newConnected.delete(platformId);
      setConnectedPlatforms(newConnected);
    } else {
      newSelected.add(platformId);
    }
    setSelectedPlatforms(newSelected);
  };

  const handleConnect = async (platformId: string) => {
    setConnectingPlatform(platformId);

    try {
      // Simulate OAuth connection (in production, this would trigger OAuth flow)
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newConnected = new Set(connectedPlatforms);
      newConnected.add(platformId);
      setConnectedPlatforms(newConnected);

      // Auto-complete when at least one platform is connected
      if (newConnected.size >= 1) {
        const platformData = Array.from(selectedPlatforms).map(type => ({
          type,
          connected: newConnected.has(type),
        }));

        await onComplete({
          platforms: platformData,
          skipped: false,
        });
      }
    } catch (error) {
      console.error("Connection error:", error);
    } finally {
      setConnectingPlatform(null);
    }
  };

  const isPlatformConnected = (platformId: string) => connectedPlatforms.has(platformId);
  const isPlatformSelected = (platformId: string) => selectedPlatforms.has(platformId);
  const isConnecting = (platformId: string) => connectingPlatform === platformId;

  const connectedCount = connectedPlatforms.size;
  const canProceed = connectedCount >= 1;

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Connect Your Publishing Platforms</h2>
        <p className="text-muted-foreground text-lg">
          Choose 1-2 platforms to start publishing your content
        </p>
        {connectedCount > 0 && (
          <p className="text-sm text-green-600 font-medium">
            ✓ {connectedCount} platform{connectedCount > 1 ? "s" : ""} connected
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PLATFORMS.map((platform) => {
          const Icon = platform.icon;
          const selected = isPlatformSelected(platform.id);
          const connected = isPlatformConnected(platform.id);
          const connecting = isConnecting(platform.id);

          return (
            <Card
              key={platform.id}
              className={`p-6 cursor-pointer transition-all hover:shadow-md ${
                selected ? "ring-2 ring-purple-500 bg-purple-50" : ""
              } ${connected ? "bg-green-50 ring-2 ring-green-500" : ""}`}
              onClick={() => !connected && handlePlatformSelect(platform.id)}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className={`${platform.color} p-3 rounded-lg text-white`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  {connected && (
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="font-semibold text-lg">{platform.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {platform.description}
                  </p>
                </div>

                {selected && !connected && (
                  <Button
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleConnect(platform.id);
                    }}
                    disabled={connecting}
                  >
                    {connecting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Connect {platform.name}
                      </>
                    )}
                  </Button>
                )}

                {connected && (
                  <div className="flex items-center justify-center py-2 text-green-600 font-medium">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Connected
                  </div>
                )}

                {!selected && !connected && (
                  <Button variant="outline" className="w-full">
                    Select Platform
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {selectedPlatforms.size > 0 && connectedCount === 0 && (
        <div className="text-center space-y-4 p-6 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-900">
            Click the <strong>Connect</strong> button on your selected platform{selectedPlatforms.size > 1 ? "s" : ""} to authorize access
          </p>
        </div>
      )}

      {!canProceed && (
        <div className="text-center text-sm text-muted-foreground">
          You can skip this step and connect platforms later from settings
        </div>
      )}
    </div>
  );
}
