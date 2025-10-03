"use client"

import * as React from "react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { HelpCircle, Info, Keyboard } from "lucide-react"

interface HelpTooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
  keyboard?: string
  type?: "info" | "help" | "keyboard"
}

export function HelpTooltip({
  content,
  children,
  side = "top",
  keyboard,
  type = "help",
}: HelpTooltipProps) {
  const Icon = type === "keyboard" ? Keyboard : type === "info" ? Info : HelpCircle

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-start gap-2">
              <Icon className="h-4 w-4 mt-0.5 shrink-0 opacity-70" />
              <div className="text-sm">{content}</div>
            </div>
            {keyboard && (
              <div className="flex items-center gap-1.5 text-xs opacity-70 ml-6">
                <Keyboard className="h-3 w-3" />
                <span>{keyboard}</span>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface SimpleHelpTooltipProps {
  text: string
  children: React.ReactNode
  side?: "top" | "right" | "bottom" | "left"
}

export function SimpleHelpTooltip({ text, children, side = "top" }: SimpleHelpTooltipProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent side={side}>
          <p className="text-sm">{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
