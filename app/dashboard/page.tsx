"use client"

import { useState, useEffect } from "react"
import { Plus } from "lucide-react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { ProjectCard } from "@/components/project/ProjectCard"
import { ProjectForm } from "@/components/project/ProjectForm"
import { Button } from "@/components/ui/button"
import { CardSkeleton } from "@/components/ui/skeleton"
import { NoProjectsEmptyState } from "@/components/ui/empty-state"
import { useToastNotifications } from "@/lib/hooks/use-toast-notifications"
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
}

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const toast = useToastNotifications()

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const response = await fetch("/api/projects")
      if (!response.ok) throw new Error("Failed to fetch projects")
      const data = await response.json()
      setProjects(data)
    } catch (error) {
      console.error("Error fetching projects:", error)
      toast.error("Failed to load projects", "Please try refreshing the page")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateProject = async (data: ProjectFormData) => {
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error("Failed to create project")

      const newProject = await response.json()
      setProjects((prev) => [newProject, ...prev])
      toast.success("Project created", `${data.name} has been created successfully`)
      setIsCreateOpen(false)
    } catch (error) {
      console.error("Error creating project:", error)
      toast.error("Failed to create project", "Please try again")
      throw error
    }
  }

  const handleUpdateProject = async (data: ProjectFormData) => {
    if (!editingProject) return

    try {
      const response = await fetch(`/api/projects/${editingProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error("Failed to update project")

      const updatedProject = await response.json()
      setProjects((prev) =>
        prev.map((p) => (p.id === updatedProject.id ? updatedProject : p))
      )
      toast.success("Project updated", `${data.name} has been updated`)
      setEditingProject(null)
    } catch (error) {
      console.error("Error updating project:", error)
      toast.error("Failed to update project", "Please try again")
      throw error
    }
  }

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete project")

      setProjects((prev) => prev.filter((p) => p.id !== projectId))
      toast.success("Project deleted", "The project has been removed")
    } catch (error) {
      console.error("Error deleting project:", error)
      toast.error("Failed to delete project", "Please try again")
    }
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Projects</h1>
            <p className="mt-1 md:mt-2 text-sm md:text-base text-muted-foreground">
              Manage your documentation projects and repositories
            </p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
            New Project
          </Button>
        </div>
      </div>

      {/* Project Grid */}
      {isLoading ? (
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <NoProjectsEmptyState onCreate={() => setIsCreateOpen(true)} />
      ) : (
        <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={setEditingProject}
              onDelete={handleDeleteProject}
            />
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <ProjectForm
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={handleCreateProject}
        mode="create"
      />

      {/* Edit Project Modal */}
      {editingProject && (
        <ProjectForm
          open={!!editingProject}
          onOpenChange={(open) => !open && setEditingProject(null)}
          onSubmit={handleUpdateProject}
          defaultValues={editingProject}
          mode="edit"
        />
      )}
    </DashboardLayout>
  )
}
