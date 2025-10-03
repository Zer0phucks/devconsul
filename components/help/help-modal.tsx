"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ExternalLink, FileText, Video } from "lucide-react"

interface HelpModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  topic: string
  children?: React.ReactNode
}

export function HelpModal({ open, onOpenChange, topic, children }: HelpModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl">Help: {topic}</DialogTitle>
          <DialogDescription>
            Learn how to use this feature effectively
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto pr-2">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface FeatureHelpProps {
  title: string
  description: string
  steps?: Array<{ title: string; content: string }>
  tips?: string[]
  warnings?: string[]
  relatedDocs?: Array<{ title: string; href: string }>
  videoUrl?: string
}

export function FeatureHelp({
  title,
  description,
  steps,
  tips,
  warnings,
  relatedDocs,
  videoUrl,
}: FeatureHelpProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <FileText className="h-4 w-4" />
        Help
      </Button>
      <HelpModal open={open} onOpenChange={setOpen} topic={title}>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="steps">Step-by-Step</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>

            {tips && tips.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 text-green-600">Tips</h3>
                <ul className="list-disc list-inside space-y-1">
                  {tips.map((tip, i) => (
                    <li key={i} className="text-sm text-muted-foreground">
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {warnings && warnings.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 text-yellow-600">Warnings</h3>
                <ul className="list-disc list-inside space-y-1">
                  {warnings.map((warning, i) => (
                    <li key={i} className="text-sm text-muted-foreground">
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </TabsContent>

          <TabsContent value="steps" className="space-y-4">
            {steps && steps.length > 0 ? (
              <div className="space-y-4">
                {steps.map((step, i) => (
                  <div key={i} className="border-l-2 border-primary pl-4">
                    <h4 className="font-semibold mb-1">
                      Step {i + 1}: {step.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">{step.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No step-by-step instructions available.
              </p>
            )}
          </TabsContent>

          <TabsContent value="resources" className="space-y-4">
            {videoUrl && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Video Tutorial
                </h3>
                <Button variant="outline" size="sm" asChild>
                  <a href={videoUrl} target="_blank" rel="noopener noreferrer">
                    Watch Video
                    <ExternalLink className="ml-2 h-3 w-3" />
                  </a>
                </Button>
              </div>
            )}

            {relatedDocs && relatedDocs.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Related Documentation
                </h3>
                <ul className="space-y-2">
                  {relatedDocs.map((doc, i) => (
                    <li key={i}>
                      <Button variant="link" size="sm" asChild className="h-auto p-0">
                        <a href={doc.href} className="flex items-center gap-2">
                          {doc.title}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </HelpModal>
    </>
  )
}
