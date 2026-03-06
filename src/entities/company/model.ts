import { z } from 'zod'

export const CompanySchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  nip: z.string().optional(),
  plan: z.enum(['free', 'pro', 'business', 'admin']),
  ksef_env: z.enum(['test', 'prod']).optional(),
  ksef_nip: z.string().optional().nullable(),
  ksef_token: z.string().optional().nullable(),
})

export const ProfileSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  full_name: z.string().optional(),
  company: z.string().optional(),
  company_name: z.string().optional(),
  plan: z.enum(['free', 'pro', 'business', 'admin']),
  ksef_env: z.enum(['test', 'prod']).optional(),
  ksef_nip: z.string().optional().nullable(),
  ksef_token: z.string().optional().nullable(),
})

// Union type for settings profile that can be either company or profile data
export const CompanyProfileSchema = z.union([CompanySchema, ProfileSchema])

export type Company = z.infer<typeof CompanySchema>
export type Profile = z.infer<typeof ProfileSchema>
export type CompanyProfile = z.infer<typeof CompanyProfileSchema>
