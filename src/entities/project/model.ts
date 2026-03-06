import { z } from 'zod'

export const ProjectSchema = z.object({
  id: z.string(),
  company_id: z.string(),
  client_id: z.string().nullable(),
  estimate_id: z.string().nullable().optional(),
  number: z.string(),
  name: z.string().min(1),
  status: z.enum(['offer', 'active', 'done', 'cancelled']),
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  address: z.string().optional(),
  budget: z.number().nonnegative().nullable(),
  costs: z.number().nonnegative().nullable().optional(),
  notes: z.string().optional(),
  created_at: z.string(),
})

export type Project = z.infer<typeof ProjectSchema>
export type CreateProjectInput = Pick<Project, 'client_id' | 'estimate_id' | 'name' | 'status' | 'start_date' | 'end_date' | 'address' | 'budget' | 'costs' | 'notes'> & { company_id: string }
