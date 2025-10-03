import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { projectSchema } from "@/lib/validations/project"

const prisma = new PrismaClient()

// GET /api/projects - List all projects for authenticated user
export async function GET(request: NextRequest) {
  try {
    // TODO: Get user ID from session/auth middleware
    // For now, assume userId is available
    const userId = request.headers.get("x-user-id") || "default-user"

    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        repository: true,
        description: true,
        status: true,
        websiteUrl: true,
        deploymentUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Transform to match frontend interface
    const transformedProjects = projects.map((project) => ({
      id: project.id,
      name: project.name,
      repository: project.repository,
      description: project.description,
      status: project.status,
      websiteUrl: project.websiteUrl,
      deploymentUrl: project.deploymentUrl,
      lastUpdated: project.updatedAt.toISOString(),
      createdAt: project.createdAt.toISOString(),
    }))

    return NextResponse.json(transformedProjects)
  } catch (error) {
    console.error("Error fetching projects:", error)
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    )
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body
    const validatedData = projectSchema.parse(body)

    // TODO: Get user ID from session/auth middleware
    const userId = request.headers.get("x-user-id") || "default-user"

    // Create project in database
    const project = await prisma.project.create({
      data: {
        name: validatedData.name,
        repository: validatedData.repository,
        description: validatedData.description || null,
        websiteUrl: validatedData.websiteUrl || null,
        deploymentUrl: validatedData.deploymentUrl || null,
        userId,
        status: "inactive",
      },
    })

    return NextResponse.json(
      {
        id: project.id,
        name: project.name,
        repository: project.repository,
        description: project.description,
        status: project.status,
        websiteUrl: project.websiteUrl,
        deploymentUrl: project.deploymentUrl,
        lastUpdated: project.updatedAt.toISOString(),
        createdAt: project.createdAt.toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Error creating project:", error)

    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: "Invalid project data", details: error },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    )
  }
}
