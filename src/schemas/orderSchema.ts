import { z } from 'zod'

export const attributeValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
])

export const parsedItemSchema = z
  .object({
    description: z.string().min(1),
    quantity: z.number().int().min(1),
    attributes: z.record(z.string(), attributeValueSchema),
  })
  .strict()

export const parsedOrderSchema = z
  .object({
    customer: z.string().min(1).nullable(),
    items: z.array(parsedItemSchema),
    due_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .nullable(),
    amount: z.number().nullable(),
    references_prior_order: z.boolean(),
    confidence: z.number().min(0).max(1),
    needs_clarification: z.boolean(),
  })
  .strict()

export type ParsedItem = z.infer<typeof parsedItemSchema>
export type ParsedOrder = z.infer<typeof parsedOrderSchema>