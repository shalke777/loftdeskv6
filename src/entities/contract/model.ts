import { z } from 'zod'

export const ContractTrancheSchema = z.object({
  id: z.string(),
  label: z.string().min(1),
  amount: z.number().nonnegative(),
  due_date: z.string().nullable().optional(),
  status: z.enum(['planned', 'invoiced', 'paid']).default('planned'),
})

export const ContractSchema = z.object({
  id: z.string(),
  company_id: z.string(),
  client_id: z.string().nullable(),
  project_id: z.string().nullable(),
  estimate_id: z.string().nullable().optional(),
  number: z.string(),
  status: z.enum(['unsigned', 'signed']),
  sign_date: z.string().nullable(),
  value: z.number().nonnegative(),
  notes: z.string().optional(),
  template_name: z.string().optional(),
  template_content: z.string().optional(),
  created_at: z.string(),
  tranches: z.array(ContractTrancheSchema).optional().default([]),
})

export type Contract = z.infer<typeof ContractSchema>
export type ContractTranche = z.infer<typeof ContractTrancheSchema>
export type CreateContractInput = Pick<Contract, 'client_id' | 'project_id' | 'estimate_id' | 'status' | 'sign_date' | 'value' | 'notes' | 'template_name' | 'template_content' | 'tranches'> & { company_id: string }
