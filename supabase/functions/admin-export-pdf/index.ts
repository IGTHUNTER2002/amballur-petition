import 'npm:regenerator-runtime@0.14.1/runtime'
import { PDFDocument, rgb } from 'npm:pdf-lib@1.17.1'
import fontkit from 'npm:@pdf-lib/fontkit@1.1.1'
import { z } from 'npm:zod@3.24.2'
import { corsHeaders, errorResponse, HttpError, json, optionsResponse } from '../_shared/http.ts'
import { serviceClient } from '../_shared/security.ts'

const A4: [number, number] = [595.28, 841.89]
const margin = 44
const exportSchema = z.object({ petitionId: z.string().uuid() }).strict()

interface ExportSubmission {
  reference: string
  residentName: string
  houseName: string
  wardNumber: string
  submittedAt: string
  signaturePath: string
}

interface ExportPayload {
  petition: {
    id: string
    panchayatNameEn: string
    panchayatNameMl: string
    versionNumber: number
    titleEn: string
    titleMl: string
    recipientEn: string
    recipientMl: string
    bodyEn: string
    bodyMl: string
    actionsEn: string[]
    actionsMl: string[]
  }
  submissions: ExportSubmission[]
}

function cleanText(value: string) {
  // pdf-lib/fontkit's complex-script shaper requires an initial non-complex
  // glyph. A soft hyphen is non-printing unless a line breaks at that point.
  return '\u00AD' + value
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0)
      return (code >= 0 && code <= 8) || code === 11 || code === 12 || (code >= 14 && code <= 31) ? ' ' : char
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
}

function splitLine(font: { widthOfTextAtSize: (text: string, size: number) => number }, text: string, size: number, maxWidth: number) {
  const words = cleanText(text).split(' ')
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (font.widthOfTextAtSize(next, size) <= maxWidth || !current) current = next
    else { lines.push(current); current = word }
  }
  if (current) lines.push(current)
  return lines
}

async function createPdf(payload: ExportPayload, client: ReturnType<typeof serviceClient>) {
  const pdf = await PDFDocument.create()
  pdf.registerFontkit(fontkit)
  const fontBytes = await Deno.readFile(new URL('../_shared/assets/NotoSansMalayalam.ttf', import.meta.url))
  const font = await pdf.embedFont(fontBytes, { subset: true })
  const pages: Array<{ page: ReturnType<typeof pdf.addPage>; number: number }> = []
  let page = pdf.addPage(A4)
  let pageNumber = 1
  let y = A4[1] - margin
  pages.push({ page, number: pageNumber })

  const nextPage = () => {
    page = pdf.addPage(A4)
    pageNumber += 1
    y = A4[1] - margin
    pages.push({ page, number: pageNumber })
  }
  const ensure = (height: number) => { if (y - height < margin + 24) nextPage() }
  const line = (text: string, size = 10, color = rgb(0.12, 0.16, 0.22), indent = 0, leading = size * 1.55) => {
    for (const part of splitLine(font, text, size, A4[0] - margin * 2 - indent)) {
      ensure(leading)
      page.drawText(part, { x: margin + indent, y, size, font, color })
      y -= leading
    }
  }
  const heading = (text: string, size = 17) => {
    ensure(size * 2)
    page.drawText(cleanText(text), { x: margin, y, size, font, color: rgb(0.02, 0.31, 0.24) })
    y -= size * 1.8
  }
  const rule = () => { ensure(16); page.drawLine({ start: { x: margin, y: y + 3 }, end: { x: A4[0] - margin, y: y + 3 }, thickness: 0.8, color: rgb(0.82, 0.88, 0.86) }); y -= 13 }

  heading(payload.petition.panchayatNameEn, 13)
  heading(payload.petition.panchayatNameMl, 12)
  rule()
  heading('Community petition / സമൂഹ ഹർജി', 10)
  heading(payload.petition.titleEn, 18)
  heading(payload.petition.titleMl, 14)
  line(payload.petition.recipientEn, 10, rgb(0.2, 0.25, 0.3))
  line(payload.petition.recipientMl, 10, rgb(0.2, 0.25, 0.3))
  line(`Prepared: ${new Intl.DateTimeFormat('en-IN', { dateStyle: 'long' }).format(new Date())} · Petition version ${payload.petition.versionNumber}`, 8.5, rgb(0.35, 0.4, 0.45))
  y -= 8
  heading('Petition text', 12)
  line(payload.petition.bodyEn, 10)
  y -= 5
  line(payload.petition.bodyMl, 10)
  y -= 9
  heading('Requested actions / ആവശ്യപ്പെടുന്ന നടപടികൾ', 12)
  payload.petition.actionsEn.forEach((action, index) => line(`${index + 1}. ${action}`, 10, rgb(0.12, 0.16, 0.22), 4))
  payload.petition.actionsMl.forEach((action, index) => line(`${index + 1}. ${action}`, 10, rgb(0.12, 0.16, 0.22), 4))
  y -= 9
  line('The following register lists electronically captured signatures supporting this petition. These signatures are not represented as cryptographically certified digital signatures.', 8.5, rgb(0.35, 0.4, 0.45))
  y -= 8
  heading(`Signature register · ${payload.submissions.length} valid signature${payload.submissions.length === 1 ? '' : 's'}`, 12)

  for (const [index, submission] of payload.submissions.entries()) {
    ensure(88)
    const top = y
    page.drawRectangle({ x: margin, y: top - 77, width: A4[0] - margin * 2, height: 77, borderColor: rgb(0.84, 0.88, 0.9), borderWidth: 0.6 })
    page.drawText(`${index + 1}. ${cleanText(submission.residentName)}`, { x: margin + 9, y: top - 16, size: 9.5, font, color: rgb(0.08, 0.12, 0.17) })
    page.drawText(cleanText(submission.houseName), { x: margin + 9, y: top - 31, size: 8.5, font, color: rgb(0.25, 0.3, 0.35) })
    page.drawText(`Ward ${cleanText(submission.wardNumber)} · ${new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(submission.submittedAt))}`, { x: margin + 9, y: top - 46, size: 7.8, font, color: rgb(0.35, 0.4, 0.45) })
    page.drawText(cleanText(submission.reference), { x: margin + 9, y: top - 61, size: 7.5, font, color: rgb(0.35, 0.4, 0.45) })
    const { data: signatureBlob, error: signatureError } = await client.storage.from('petition-signatures').download(submission.signaturePath)
    if (signatureError || !signatureBlob) throw new HttpError(500, 'A stored signature could not be retrieved for the export.')
    const signature = await pdf.embedPng(new Uint8Array(await signatureBlob.arrayBuffer()))
    const dimensions = signature.scaleToFit(140, 50)
    page.drawImage(signature, { x: A4[0] - margin - 150 + (140 - dimensions.width) / 2, y: top - 67 + (50 - dimensions.height) / 2, width: dimensions.width, height: dimensions.height })
    y -= 85
  }

  for (const current of pages) {
    current.page.drawLine({ start: { x: margin, y: 27 }, end: { x: A4[0] - margin, y: 27 }, thickness: 0.6, color: rgb(0.82, 0.88, 0.86) })
    current.page.drawText(`${payload.petition.panchayatNameEn} · Electronically captured petition signatures`, { x: margin, y: 15, size: 7, font, color: rgb(0.35, 0.4, 0.45) })
    current.page.drawText(`Page ${current.number} of ${pages.length}`, { x: A4[0] - margin - 55, y: 15, size: 7, font, color: rgb(0.35, 0.4, 0.45) })
  }
  return pdf.save()
}

Deno.serve(async (request) => {
  try {
    if (request.method === 'OPTIONS') return optionsResponse(request)
    if (request.method !== 'POST') return json(request, { error: 'Method not allowed.' }, 405)
    corsHeaders(request)
    const authorization = request.headers.get('authorization')
    if (!authorization?.startsWith('Bearer ')) throw new HttpError(401, 'Administrator authentication is required.')
    const client = serviceClient()
    const { data: userData, error: userError } = await client.auth.getUser(authorization.slice(7))
    if (userError || !userData.user) throw new HttpError(401, 'Administrator authentication is required.')
    const { data: admin, error: adminError } = await client.from('admin_profiles').select('id').eq('id', userData.user.id).eq('is_active', true).eq('is_primary', true).maybeSingle()
    if (adminError || !admin) throw new HttpError(403, 'Administrator access is required.')
    const { petitionId } = exportSchema.parse(await request.json())
    const { data, error: payloadError } = await client.rpc('get_pdf_export_payload', { p_petition_id: petitionId, p_admin_id: userData.user.id })
    if (payloadError || !data) throw new HttpError(404, 'The petition export data could not be prepared.')
    const payload = data as ExportPayload
    const pdfBytes = await createPdf(payload, client)
    const objectPath = `${petitionId}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.pdf`
    const { error: uploadError } = await client.storage.from('petition-exports').upload(objectPath, pdfBytes, { contentType: 'application/pdf', upsert: false })
    if (uploadError) throw new HttpError(503, 'The PDF could not be stored safely.')
    const { error: exportError } = await client.from('export_records').insert({ petition_id: petitionId, generated_by: userData.user.id, object_path: objectPath, valid_signature_count: payload.submissions.length })
    if (exportError) throw new HttpError(503, 'The export audit record could not be saved.')
    await client.from('admin_audit_logs').insert({ admin_id: userData.user.id, action: 'generate_pdf_export', entity_type: 'petition', entity_id: petitionId, details: { objectPath, validSignatureCount: payload.submissions.length } })
    const { data: signed, error: signedError } = await client.storage.from('petition-exports').createSignedUrl(objectPath, 300)
    if (signedError || !signed?.signedUrl) throw new HttpError(503, 'The PDF download link could not be created.')
    return json(request, { url: signed.signedUrl })
  } catch (error) {
    if (error instanceof z.ZodError) return json(request, { error: 'The export request is invalid.' }, 400)
    return errorResponse(request, error)
  }
})
