"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import {
  BookOpen,
  FileText,
  HelpCircle,
  Keyboard,
  Mail,
  MessageSquare,
  Search,
  Video,
} from "lucide-react"
import { useRouter } from "next/navigation"

interface HelpItem {
  title: string
  description: string
  href: string
  category: "guide" | "video" | "faq" | "api" | "support"
  keywords?: string[]
}

const helpItems: HelpItem[] = [
  {
    title: "Getting Started",
    description: "Learn the basics of Full Self Publishing",
    href: "/docs/getting-started",
    category: "guide",
    keywords: ["setup", "onboarding", "start", "begin"],
  },
  {
    title: "Connect GitHub Repository",
    description: "Link your GitHub repo to start generating content",
    href: "/docs/getting-started#connect-github",
    category: "guide",
    keywords: ["github", "repository", "connect", "oauth"],
  },
  {
    title: "Platform Integrations",
    description: "Connect social media and publishing platforms",
    href: "/docs/integrations",
    category: "guide",
    keywords: ["platforms", "social", "blog", "connect"],
  },
  {
    title: "WordPress Integration",
    description: "Connect and publish to WordPress",
    href: "/docs/integrations/wordpress",
    category: "guide",
  },
  {
    title: "Twitter/X Integration",
    description: "Automate tweets and threads",
    href: "/docs/integrations/twitter",
    category: "guide",
  },
  {
    title: "LinkedIn Integration",
    description: "Share updates on LinkedIn",
    href: "/docs/integrations/linkedin",
    category: "guide",
  },
  {
    title: "Content Generation",
    description: "How AI generates content from your commits",
    href: "/docs/features/content-generation",
    category: "guide",
  },
  {
    title: "Scheduling & Automation",
    description: "Set up automated content publishing",
    href: "/docs/features/scheduling",
    category: "guide",
  },
  {
    title: "API Reference",
    description: "Complete API documentation",
    href: "/docs/api",
    category: "api",
  },
  {
    title: "Quick Start Video",
    description: "2-minute platform overview",
    href: "/docs/videos/quick-start",
    category: "video",
  },
  {
    title: "Contact Support",
    description: "Get help from our team",
    href: "/support",
    category: "support",
  },
]

export function HelpWidget() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
      if (e.key === "?" && !e.metaKey && !e.ctrlKey) {
        const target = e.target as HTMLElement
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          e.preventDefault()
          setOpen(true)
        }
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const handleSelect = (href: string) => {
    setOpen(false)
    router.push(href)
  }

  const getCategoryIcon = (category: HelpItem["category"]) => {
    switch (category) {
      case "guide":
        return <BookOpen className="h-4 w-4" />
      case "video":
        return <Video className="h-4 w-4" />
      case "faq":
        return <MessageSquare className="h-4 w-4" />
      case "api":
        return <FileText className="h-4 w-4" />
      case "support":
        return <Mail className="h-4 w-4" />
    }
  }

  return (
    <>
      {/* Floating Help Button */}
      <Button
        onClick={() => setOpen(true)}
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        aria-label="Open help"
      >
        <HelpCircle className="h-6 w-6" />
      </Button>

      {/* Command Palette Dialog */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search help and documentation..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Guides">
            {helpItems
              .filter((item) => item.category === "guide")
              .map((item) => (
                <CommandItem
                  key={item.href}
                  onSelect={() => handleSelect(item.href)}
                  className="gap-2"
                >
                  {getCategoryIcon(item.category)}
                  <div className="flex flex-col">
                    <span>{item.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.description}
                    </span>
                  </div>
                </CommandItem>
              ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Videos">
            {helpItems
              .filter((item) => item.category === "video")
              .map((item) => (
                <CommandItem
                  key={item.href}
                  onSelect={() => handleSelect(item.href)}
                  className="gap-2"
                >
                  {getCategoryIcon(item.category)}
                  <div className="flex flex-col">
                    <span>{item.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.description}
                    </span>
                  </div>
                </CommandItem>
              ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="API & Support">
            {helpItems
              .filter((item) => item.category === "api" || item.category === "support")
              .map((item) => (
                <CommandItem
                  key={item.href}
                  onSelect={() => handleSelect(item.href)}
                  className="gap-2"
                >
                  {getCategoryIcon(item.category)}
                  <div className="flex flex-col">
                    <span>{item.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {item.description}
                    </span>
                  </div>
                </CommandItem>
              ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Keyboard Shortcuts">
            <CommandItem disabled className="gap-2">
              <Keyboard className="h-4 w-4" />
              <div className="flex flex-col flex-1">
                <div className="flex justify-between items-center">
                  <span>Open help</span>
                  <kbd className="text-xs bg-muted px-2 py-1 rounded">Cmd/Ctrl + K or ?</kbd>
                </div>
              </div>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
