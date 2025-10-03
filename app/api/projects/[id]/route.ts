import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { updateProjectSchema } from "@/lib/validations/project"

const prisma = new PrismaClient()

// GET /api/projects/[id] - Get a single project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = request.headers.get("x-user-id") || "default-user"

    const project = await prisma.project.findFirst({
      where: { id, userId },
    })

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: project.id,
      name: project.name,
      repository: project.repository,
      description: project.description,
      status: project.status,
      websiteUrl: project.websiteUrl,
      deploymentUrl: project.deploymentUrl,
      lastUpdated: project.updatedAt.toISOString(),
      createdAt: project.createdAt.toISOString(),
    })
  } catch (error) {
    console.error("Error fetching project:", error)
    return NextResponse.json(
      { error: "Failed to fetch project" },
      { status: 500 }
    )
  }
}

// PATCH /api/projects/[id] - Update a project
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const userId = request.headers.get("x-user-id") || "default-user"

    // Validate request body
    const validatedData = updateProjectSchema.parse(body)

    // Check if project exists and belongs to user
    const existingProject = await prisma.project.findFirst({
      where: { id, userId },
    })

    if (!existingProject) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      )
    }

    // Update project
    const project = await prisma.project.update({
      where: { id },
      data: {
        name: validatedData.name,
        repository: validatedData.repository,
        description: validatedData.description,
        websiteUrl: validatedData.websiteUrl,
        deploymentUrl: validatedData.deploymentUrl,
      },
    })

    return NextResponse.json({
      id: project.id,
      name: project.name,
      repository: project.repository,
      description: project.description,
      status: project.status,
      websiteUrl: project.websiteUrl,
      deploymentUrl: project.deploymentUrl,
      lastUpdated: project.updatedAt.toISOString(),
      createdAt: project.createdAt.toISOString(),
    })
  } catch (error) {
    console.error("Error updating project:", error)

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid project data", details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    )
  }
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const userId = request.headers.get("x-user-id") || "default-user"

    // Check if project exists and belongs to user
    const existingProject = await prisma.project.findFirst({
      where: { id, userId },
    })

    if (!existingProject) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      )
    }

    // Delete project
    await prisma.project.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting project:", error)
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    )
  }
}
