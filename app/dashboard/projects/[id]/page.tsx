"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ExternalLink, GitBranch, Settings, Trash2 } from "lucide-react"
import { AppShell } from "@/components/layout/AppShell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ProjectForm } from "@/components/project/ProjectForm"
import type { ProjectFormData } from "@/lib/validations/project"

interface Project {
  id: string
  name: string
  repository: string
  description?: string
  status?: string
  lastUpdated: string
  websiteUrl?: string
  deploymentUrl?: string
  createdAt: string
}

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditOpen, setIsEditOpen] = useState(false)

  useEffect(() => {
    fetchProject()
  }, [resolvedParams.id])

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${resolvedParams.id}`)
      if (!response.ok) throw new Error("Failed to fetch project")
      const data = await response.json()
      setProject(data)
    } catch (error) {
      console.error("Error fetching project:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateProject = async (data: ProjectFormData) => {
    try {
      const response = await fetch(`/api/projects/${resolvedParams.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error("Failed to update project")

      const updatedProject = await response.json()
      setProject(updatedProject)
    } catch (error) {
      console.error("Error updating project:", error)
      throw error
    }
  }

  const handleDeleteProject = async () => {
    if (!confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/projects/${resolvedParams.id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete project")

      router.push("/dashboard")
    } catch (error) {
      console.error("Error deleting project:", error)
    }
  }

  if (isLoading) {
    return (
      <AppShell>
        <div className="max-w-5xl mx-auto">
          <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
        </div>
      </AppShell>
    )
  }

  if (!project) {
    return (
      <AppShell>
        <div className="max-w-5xl mx-auto text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Project not found</h2>
          <p className="text-gray-600 mb-6">The project you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {project.name}
              </h1>
              <div className="flex items-center gap-2 text-gray-600">
                <GitBranch className="h-5 w-5" />
                <span>{project.repository}</span>
              </div>
              {project.description && (
                <p className="mt-4 text-gray-600">{project.description}</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/dashboard/projects/${resolvedParams.id}/settings`)}
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
              <Button variant="outline" onClick={() => setIsEditOpen(true)}>
                Edit Project
              </Button>
              <Button variant="outline" onClick={handleDeleteProject}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </div>

        {/* Project Details */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
              <CardDescription>Basic details about this project</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-500">Status</div>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    project.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {project.status || 'inactive'}
                  </span>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500">Repository</div>
                <div className="mt-1 text-sm text-gray-900">{project.repository}</div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500">Created</div>
                <div className="mt-1 text-sm text-gray-900">
                  {new Date(project.createdAt).toLocaleDateString()}
                </div>
              </div>

              <div>
                <div className="text-sm font-medium text-gray-500">Last Updated</div>
                <div className="mt-1 text-sm text-gray-900">
                  {new Date(project.lastUpdated).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Links</CardTitle>
              <CardDescription>External project links</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {project.websiteUrl ? (
                <a
                  href={project.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="h-4 w-4" />
                  Visit Website
                </a>
              ) : (
                <div className="text-sm text-gray-500">No website URL configured</div>
              )}

              {project.deploymentUrl ? (
                <a
                  href={project.deploymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Deployment
                </a>
              ) : (
                <div className="text-sm text-gray-500">No deployment URL configured</div>
              )}

              <a
                href={`https://github.com/${project.repository}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
              >
                <GitBranch className="h-4 w-4" />
                View on GitHub
              </a>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Project Modal */}
      {isEditOpen && (
        <ProjectForm
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          onSubmit={handleUpdateProject}
          defaultValues={project}
          mode="edit"
        />
      )}
    </AppShell>
  )
}
