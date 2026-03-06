import { z } from 'zod'

export const InvoiceItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1),
  unit: z.string().default('kpl'),
  quantity: z.number().positive(),
  unit_price: z.number().nonnegative(),
  vat_rate: z.number().min(0).max(100).default(23),
  sort_order: z.number().int(),
  tranche_label: z.string().optional(),
})

export const InvoiceSchema = z.object({
  id: z.string(),
  company_id: z.string(),
  client_id: z.string().nullable(),
  project_id: z.string().nullable(),
  contract_id: z.string().nullable().optional(),
  estimate_id: z.string().nullable().optional(),
  number: z.string(),
  status: z.enum(['unpaid', 'paid', 'overdue']),
  issue_date: z.string(),
  due_date: z.string().nullable(),
  total_net: z.number(),
  total_gross: z.number(),
  ksef_status: z.enum(['ksef_sent', 'ksef_pending', 'ksef_error']).nullable(),
  ksef_ref: z.string().nullable(),
  notes: z.string().optional(),
  created_at: z.string(),
  items: z.array(InvoiceItemSchema),
})

export type Invoice = z.infer<typeof InvoiceSchema>
export type InvoiceItem = z.infer<typeof InvoiceItemSchema>
export type CreateInvoiceInput = Pick<Invoice, 'client_id' | 'project_id' | 'contract_id' | 'estimate_id' | 'notes' | 'status'> & {
  company_id: string
  items: InvoiceItem[]
  issue_date: string
  due_date: string | null
}
