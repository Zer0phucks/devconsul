import { z } from "zod"

export const projectSchema = z.object({
  name: z
    .string()
    .min(1, "Project name is required")
    .max(100, "Project name must be less than 100 characters"),

  repository: z
    .string()
    .min(1, "Repository is required")
    .refine(
      (val) => {
        // Accept formats: owner/repo or github.com/owner/repo
        return /^([^\/]+)\/([^\/]+)$/.test(val) || /github\.com\/([^\/]+)\/([^\/]+)/.test(val)
      },
      { message: "Repository must be in format 'owner/repo'" }
    ),

  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),

  websiteUrl: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),

  deploymentUrl: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
})

export const updateProjectSchema = projectSchema.partial()

export type ProjectFormData = z.infer<typeof projectSchema>
export type UpdateProjectData = z.infer<typeof updateProjectSchema>
