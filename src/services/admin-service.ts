import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { AdminProfile, AdminSubmission, DashboardMetrics, PublicPetition } from '../types/petition'

export class AdminServiceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AdminServiceError'
  }
}

function requireClient() {
  if (!supabase) throw new AdminServiceError('Supabase is not configured.')
  return supabase
}

export async function getAdminProfile(user: User): Promise<AdminProfile | null> {
  const client = requireClient()
  const { data, error } = await client
    .from('admin_profiles')
    .select('id, display_name, is_primary')
    .eq('id', user.id)
    .maybeSingle()
  if (error) throw new AdminServiceError('Your administrator access could not be verified.')
  if (!data) return null
  return {
    id: data.id as string,
    email: user.email ?? '',
    displayName: data.display_name as string,
    isPrimary: data.is_primary as boolean,
  }
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const client = requireClient()
  const { data, error } = await client.rpc('get_admin_dashboard_metrics')
  if (error) throw new AdminServiceError('Dashboard metrics could not be loaded.')
  return data as DashboardMetrics
}

export async function getAdminSubmissions(search: string, wardId: string, page: number, pageSize = 20) {
  const client = requireClient()
  const { data, error } = await client.rpc('get_admin_submissions', {
    search_term: search || null,
    ward_filter: wardId || null,
    page_number: page,
    page_size: pageSize,
  })
  if (error) throw new AdminServiceError('Submissions could not be loaded.')
  return data as { items: AdminSubmission[]; total: number }
}

export async function updateSubmissionReview(id: string, status: 'valid' | 'needs_review' | 'excluded', reason?: string) {
  const client = requireClient()
  const { error } = await client.rpc('review_submission', {
    target_submission_id: id,
    next_status: status,
    exclusion_reason: reason ?? null,
  })
  if (error) throw new AdminServiceError('The review status could not be saved.')
}

export async function createSignatureUrl(path: string) {
  const client = requireClient()
  const { data, error } = await client.storage.from('petition-signatures').createSignedUrl(path, 60)
  if (error || !data?.signedUrl) throw new AdminServiceError('The signature preview could not be opened.')
  return data.signedUrl
}

export async function exportPetitionPdf(petitionId: string) {
  const client = requireClient()
  const { data, error } = await client.functions.invoke('admin-export-pdf', { body: { petitionId } })
  if (error || !data?.url) throw new AdminServiceError('The PDF export could not be generated.')
  return data.url as string
}

export async function savePetitionSettings(petition: PublicPetition) {
  const client = requireClient()
  const { error } = await client.rpc('update_petition_settings', {
    petition_payload: petition,
  })
  if (error) throw new AdminServiceError('The petition settings could not be saved.')
}
