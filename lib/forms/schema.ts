import * as z from "zod"

const requiredText = z
  .string({ error: "This field is required." })
  .trim()
  .min(1, "This field is required.")
  .max(256, "Must be 256 characters or fewer.")

const optionalText = z.string().trim().max(256, "Must be 256 characters or fewer.").default("")

export const emailSchema = z
  .string({ error: "Enter a valid email address." })
  .trim()
  .min(1, "Enter a valid email address.")
  .max(254, "Enter a valid email address.")
  .pipe(z.email("Enter a valid email address."))

const pageUrlSchema = z.string().trim().max(2000).default("")

export const scheduleTopics = [
  "Web Development",
  "QA & Testing",
  "Digital Marketing",
  "Staff Augmentation",
  "Other",
] as const

export const employeeRanges = ["1 - 10", "11 - 50", "51 - 500", "500 +"] as const

export const scheduleSchema = z.object({
  name: optionalText,
  email: emailSchema,
  message: z
    .string({ error: "This field is required." })
    .trim()
    .min(1, "This field is required.")
    .max(5000, "Must be 5000 characters or fewer."),
  topic: z.union([z.literal(""), z.enum(scheduleTopics)]).default(""),
  pageUrl: pageUrlSchema,
})

export const usaSchema = z.object({
  employees: z.enum(employeeRanges, { error: "Select the number of employees." }),
  firstName: requiredText,
  lastName: requiredText,
  email: emailSchema,
  jobTitle: requiredText,
  company: requiredText,
  phone: optionalText,
  subscribe: z.boolean().default(false),
  pageUrl: pageUrlSchema,
})

export const newsletterSchema = z.object({
  email: emailSchema,
  terms: z.literal(true, { error: "Please accept the Terms and Conditions." }),
  pageUrl: pageUrlSchema,
})

export type ScheduleInput = z.infer<typeof scheduleSchema>
export type UsaInput = z.infer<typeof usaSchema>
export type NewsletterInput = z.infer<typeof newsletterSchema>

export function fieldErrorsFrom(error: z.ZodError) {
  const fieldErrors: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = issue.path[0]
    if (typeof key !== "string" || fieldErrors[key]) continue
    fieldErrors[key] = issue.message
  }
  return fieldErrors
}
