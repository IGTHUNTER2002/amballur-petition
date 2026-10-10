import { z } from 'zod'

const phonePattern = /^(?:[6-9]\d{9}|\+91[6-9]\d{9})$/

export function normalizeIndianMobile(value: string) {
  const compact = value.trim().replace(/[\s-]/g, '')
  const national = compact.startsWith('+91') ? compact.slice(3) : compact
  if (!/^[6-9]\d{9}$/.test(national)) return null
  return `+91${national}`
}

export const residentSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your full name.').max(120),
  houseName: z.string().trim().min(1, 'Enter your house name or number.').max(160),
  wardId: z.string().uuid('Choose your ward.'),
  phone: z
    .string()
    .trim()
    .min(1, 'Enter your phone number.')
    .refine((value) => phonePattern.test(value.replace(/[\s-]/g, '')), 'Enter a valid 10-digit Indian mobile number.')
    .transform((value) => normalizeIndianMobile(value)!),
  locality: z.string().trim().max(160),
  incidentDescription: z.string().trim().max(1200),
})

export type ResidentFormValues = z.infer<typeof residentSchema>

export const submissionSchema = residentSchema.extend({
  signatureDataUrl: z.string().startsWith('data:image/png;base64,', 'Please provide a valid signature image.'),
  consent: z.literal(true, { error: 'Consent is required before submission.' }),
  petitionVersionId: z.string().uuid(),
  idempotencyKey: z.string().uuid(),
  locale: z.enum(['en', 'ml']),
  turnstileToken: z.string().min(1).max(2048).optional(),
})
