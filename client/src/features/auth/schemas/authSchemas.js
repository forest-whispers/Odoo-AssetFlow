import { z } from "zod"

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
})

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name must be less than 100 characters"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters"),
  employeeId: z
    .string()
    .trim()
    .min(1, "Employee ID cannot be empty")
    .optional()
    .or(z.literal("")),
  jobTitle: z
    .string()
    .trim()
    .min(2, "Job title must be at least 2 characters")
    .optional()
    .or(z.literal("")),
})
