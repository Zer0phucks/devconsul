"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { MoreVertical, ExternalLink, Settings, Trash2, GitBranch } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"

interface Project {
  id: string
  name: string
  repository: string
  description?: string
  status?: string
  lastUpdated: Date | string
  websiteUrl?: string
  deploymentUrl?: string
}

interface ProjectCardProps {
  project: Project
  onEdit?: (project: Project) => void
  onDelete?: (projectId: string) => void
}

export function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const lastUpdated = typeof project.lastUpdated === 'string'
    ? new Date(project.lastUpdated)
    : project.lastUpdated

  const statusColors = {
    active: "bg-green-100 text-green-800",
    inactive: "bg-gray-100 text-gray-800",
    building: "bg-blue-100 text-blue-800",
    error: "bg-red-100 text-red-800",
  }

  const statusColor = statusColors[project.status as keyof typeof statusColors] || statusColors.inactive

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <Link href={`/dashboard/projects/${project.id}`}>
              <CardTitle className="text-lg hover:text-blue-600 transition-colors truncate">
                {project.name}
              </CardTitle>
            </Link>
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
              <GitBranch className="h-4 w-4" />
              <span className="truncate">{project.repository}</span>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(project)}>
                <Settings className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {project.websiteUrl && (
                <DropdownMenuItem asChild>
                  <a href={project.websiteUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Visit Site
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => onDelete?.(project.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pb-6">
        {project.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {project.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
              {project.status || 'inactive'}
            </span>
          </div>

          <span className="text-xs text-gray-500">
            Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
