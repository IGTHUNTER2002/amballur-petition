import 'npm:regenerator-runtime@0.14.1/runtime.js'
import { PDFDocument, rgb } from 'npm:pdf-lib@1.17.1'
import fontkit from 'npm:@pdf-lib/fontkit@1.1.1'
import { z } from 'npm:zod@3.24.2'
import { corsHeaders, errorResponse, HttpError, json, optionsResponse } from '../_shared/http.ts'
import { serviceClient } from '../_shared/security.ts'

const A4: [number, number] = [595.28, 841.89]
const A4_LANDSCAPE: [number, number] = [841.89, 595.28]
const margin = 44
const exportSchema = z.object({ petitionId: z.string().uuid() }).strict()

interface ExportSubmission {
  reference: string
  residentName: string
  wardNumber: string
  phone: string | null
  address: string
  submittedAt: string
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
  return value
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

async function createPdf(payload: ExportPayload) {
  const pdf = await PDFDocument.create()
  pdf.registerFontkit(fontkit)
  const fontBytes = await Deno.readFile(new URL('../_shared/assets/NotoSansMalayalam.ttf', import.meta.url))
  // fontkit has a known null-anchor fault in this font's above-base mark
  // positioning table. Keeping the other Malayalam OpenType features enabled
  // preserves normal shaping while avoiding that broken lookup.
  const font = await pdf.embedFont(fontBytes, { subset: true, features: { abvm: false } })
  const pages: Array<{ page: ReturnType<typeof pdf.addPage>; number: number; width: number }> = []
  let page = pdf.addPage(A4)
  let pageNumber = 1
  let y = A4[1] - margin
  pages.push({ page, number: pageNumber, width: A4[0] })

  const nextPortraitPage = () => {
    page = pdf.addPage(A4)
    pageNumber += 1
    y = A4[1] - margin
    pages.push({ page, number: pageNumber, width: A4[0] })
  }
  const ensure = (height: number) => { if (y - height < margin + 24) nextPortraitPage() }
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

  heading(payload.petition.panchayatNameMl, 13)
  rule()
  heading('സമൂഹ ഹർജി', 10)
  heading(payload.petition.titleMl, 14)
  line(payload.petition.recipientMl, 10, rgb(0.2, 0.25, 0.3))
  line(`തയ്യാറാക്കിയ തീയതി: ${new Intl.DateTimeFormat('en-IN', { dateStyle: 'long' }).format(new Date())}`, 8.5, rgb(0.35, 0.4, 0.45))
  y -= 8
  heading('ഹർജിയുടെ ഉള്ളടക്കം', 12)
  line(payload.petition.bodyMl, 10)
  y -= 9
  heading('ആവശ്യപ്പെടുന്ന നടപടികൾ', 12)
  payload.petition.actionsMl.forEach((action, index) => line(`${index + 1}. ${action}`, 10, rgb(0.12, 0.16, 0.22), 4))

  const tableMargin = 30
  const columns = [112, 142, 48, 82, 142, 78, 177]
  const headers = ['റഫറൻസ് നമ്പർ', 'പേര്', 'വാർഡ്', 'ഫോൺ നമ്പർ', 'വിലാസം', 'തീയതി', 'ഒപ്പ്']
  const tableText = (submission?: ExportSubmission) => submission
    ? [submission.reference, submission.residentName, submission.wardNumber, submission.phone ?? '', submission.address, new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(submission.submittedAt)), '']
    : ['', '', '', '', '', '', '']
  const drawCell = (text: string, x: number, top: number, width: number, height: number, size: number, fill?: ReturnType<typeof rgb>) => {
    page.drawRectangle({ x, y: top - height, width, height, color: fill, borderColor: rgb(0.38, 0.45, 0.44), borderWidth: 0.55 })
    const lines = splitLine(font, text, size, width - 8)
    const leading = size * 1.3
    const textHeight = lines.length * leading
    let textY = top - Math.max(8, (height - textHeight) / 2) - size
    for (const item of lines) {
      page.drawText(item, { x: x + 4, y: textY, size, font, color: rgb(0.08, 0.12, 0.17) })
      textY -= leading
    }
  }
  const addRegisterPage = () => {
    page = pdf.addPage(A4_LANDSCAPE)
    pageNumber += 1
    y = A4_LANDSCAPE[1] - tableMargin
    pages.push({ page, number: pageNumber, width: A4_LANDSCAPE[0] })
    page.drawText(cleanText(payload.petition.panchayatNameMl), { x: tableMargin, y, size: 11, font, color: rgb(0.02, 0.31, 0.24) })
    y -= 19
    page.drawText('ഒപ്പ് ശേഖരണ രജിസ്റ്റർ', { x: tableMargin, y, size: 13, font, color: rgb(0.02, 0.31, 0.24) })
    y -= 16
    page.drawText('ലഭ്യമല്ലാത്ത ഫോൺ നമ്പറുകളും വിവരങ്ങളും ശൂന്യമായി നിലനിർത്തിയിരിക്കുന്നു.', { x: tableMargin, y, size: 7.5, font, color: rgb(0.35, 0.4, 0.45) })
    y -= 17
    let x = tableMargin
    headers.forEach((header, index) => { drawCell(header, x, y, columns[index], 29, 8, rgb(0.9, 0.95, 0.92)); x += columns[index] })
    y -= 29
  }
  addRegisterPage()
  for (const row of [...payload.submissions.map(tableText), ...Array.from({ length: 12 }, () => tableText())]) {
    const sizes = row.map((text, index) => splitLine(font, text, 7.5, columns[index] - 8).length)
    const rowHeight = Math.max(34, Math.max(...sizes) * 10 + 10)
    if (y - rowHeight < tableMargin + 25) addRegisterPage()
    let x = tableMargin
    row.forEach((value, index) => { drawCell(value, x, y, columns[index], rowHeight, 7.5); x += columns[index] })
    y -= rowHeight
  }

  for (const current of pages) {
    current.page.drawLine({ start: { x: margin, y: 27 }, end: { x: current.width - margin, y: 27 }, thickness: 0.6, color: rgb(0.82, 0.88, 0.86) })
    current.page.drawText(`${payload.petition.panchayatNameMl} · ഇലക്ട്രോണിക് ആയി രേഖപ്പെടുത്തിയ ഹർജി ഒപ്പുകൾ`, { x: margin, y: 15, size: 7, font, color: rgb(0.35, 0.4, 0.45) })
    current.page.drawText(`പേജ് ${current.number} / ${pages.length}`, { x: current.width - margin - 58, y: 15, size: 7, font, color: rgb(0.35, 0.4, 0.45) })
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
    const pdfBytes = await createPdf(payload)
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
