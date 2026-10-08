export type Language = 'en' | 'ml'

export type PetitionStatus = 'draft' | 'published' | 'closed' | 'archived'

export interface LocalizedText {
  en: string
  ml: string
}

export interface Ward {
  id: string
  name: string
  number: string
}

export interface PublicPetition {
  id: string
  versionId: string
  versionNumber: number
  title: LocalizedText
  panchayatName: LocalizedText
  recipientDetails: LocalizedText
  body: LocalizedText
  requestedActions: LocalizedText[]
  privacyNotice: LocalizedText
  contactEmail: string | null
  status: PetitionStatus
  closingDate: string | null
  wards: Ward[]
}

export interface ResidentDetails {
  fullName: string
  houseName: string
  wardId: string
  phone: string
  locality: string
  incidentDescription: string
}

export interface PetitionDraft {
  resident: ResidentDetails
  signatureDataUrl: string | null
  consent: boolean
  turnstileToken: string | null
}

export interface SubmissionResult {
  reference: string
  submittedAt: string
}

export interface DashboardMetrics {
  validSignatures: number
  householdsRepresented: number
  wardsCovered: number
  recentSubmissions: number
  requiringReview: number
  byWard: Array<{ ward: string; count: number }>
  byDay: Array<{ date: string; count: number }>
}

export interface AdminSubmission {
  id: string
  reference: string
  residentName: string
  houseName: string
  wardName: string
  submittedAt: string
  reviewStatus: 'valid' | 'needs_review' | 'excluded'
  signaturePath: string
  duplicateFlags: string[]
}

export interface AdminProfile {
  id: string
  email: string
  displayName: string
  isPrimary: boolean
}
