import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import type { AdminSubmission, DashboardMetrics, PublicPetition } from '../types/petition'

const sampleSignaturePng =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKAAAAA8CAYAAAD9/zXFAAAAXklEQVR42u3PMQ0AAAgEMc6/aWxhBx8g6SZvXwEEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBE4L0F8B2/mI3hUAAAAASUVORK5CYII='

let mockSubmissions: AdminSubmission[] = [
  {
    id: '00000000-0000-4000-8000-000000000101',
    reference: 'AMB-2026-A1B2C3D4',
    residentName: 'Anu Thomas',
    houseName: 'Green Villa',
    wardName: '16 — Ward 16',
    submittedAt: '2026-10-06T14:22:00.000Z',
    reviewStatus: 'valid',
    signaturePath: sampleSignaturePng,
    duplicateFlags: [],
  },
  {
    id: '00000000-0000-4000-8000-000000000102',
    reference: 'AMB-2026-E5F6G7H8',
    residentName: 'Suresh Kumar P.',
    houseName: 'Puthenpurayil House',
    wardName: '16 — Ward 16',
    submittedAt: '2026-10-07T09:15:00.000Z',
    reviewStatus: 'needs_review',
    signaturePath: sampleSignaturePng,
    duplicateFlags: ['matching_household'],
  },
  {
    id: '00000000-0000-4000-8000-000000000103',
    residentName: 'Mini Varghese',
    reference: 'AMB-2026-J9K0L1M2',
    houseName: 'Rose Dale',
    wardName: '16 — Ward 16',
    submittedAt: '2026-10-07T11:40:00.000Z',
    reviewStatus: 'valid',
    signaturePath: sampleSignaturePng,
    duplicateFlags: [],
  },
  {
    id: '00000000-0000-4000-8000-000000000104',
    residentName: 'Rajesh Menon',
    reference: 'AMB-2026-N3P4Q5R6',
    houseName: 'Menon Nivas',
    wardName: '16 — Ward 16',
    submittedAt: '2026-10-08T08:30:00.000Z',
    reviewStatus: 'valid',
    signaturePath: sampleSignaturePng,
    duplicateFlags: [],
  },
]

export function getDemoDashboardMetrics(): DashboardMetrics {
  const valid = mockSubmissions.filter((s) => s.reviewStatus === 'valid').length
  const needingReview = mockSubmissions.filter((s) => s.reviewStatus === 'needs_review').length
  return {
    validSignatures: valid,
    householdsRepresented: valid,
    wardsCovered: 1,
    recentSubmissions: mockSubmissions.length,
    requiringReview: needingReview,
    byWard: [{ ward: '16 — Ward 16', count: valid }],
    byDay: [
      { date: '06 Oct', count: 1 },
      { date: '07 Oct', count: 2 },
      { date: '08 Oct', count: 1 },
    ],
  }
}

export function getDemoAdminSubmissions(search: string, wardId: string, page: number, pageSize = 20) {
  let filtered = [...mockSubmissions]
  if (search.trim()) {
    const query = search.trim().toLowerCase()
    filtered = filtered.filter(
      (s) =>
        s.residentName.toLowerCase().includes(query) ||
        s.houseName.toLowerCase().includes(query) ||
        s.reference.toLowerCase().includes(query),
    )
  }
  if (wardId) {
    filtered = filtered.filter((s) => s.wardName.includes(wardId))
  }
  const total = filtered.length
  const offset = (page - 1) * pageSize
  const items = filtered.slice(offset, offset + pageSize)
  return { items, total }
}

export function updateDemoSubmissionReview(id: string, status: AdminSubmission['reviewStatus']) {
  mockSubmissions = mockSubmissions.map((s) => (s.id === id ? { ...s, reviewStatus: status } : s))
}

export async function generateDemoPdf(petition: PublicPetition): Promise<string> {
  const pdf = await PDFDocument.create()
  pdf.registerFontkit(fontkit)

  let fontBytes: ArrayBuffer | null = null
  try {
    const res = await fetch('/fonts/NotoSansMalayalam.ttf')
    if (res.ok) fontBytes = await res.arrayBuffer()
  } catch {
    // Fallback if local font fetch fails
  }

  const customFont = fontBytes ? await pdf.embedFont(fontBytes) : null
  const fallbackFont = await pdf.embedStandardFont(StandardFonts.Helvetica)
  const boldFont = await pdf.embedStandardFont(StandardFonts.HelveticaBold)

  const A4: [number, number] = [595.28, 841.89]
  const margin = 44

  // Page 1: Complaint & Requested Actions
  const page1 = pdf.addPage(A4)
  let y = A4[1] - margin

  page1.drawText(petition.panchayatName.en, {
    x: margin,
    y,
    size: 14,
    font: boldFont,
    color: rgb(0.02, 0.31, 0.24),
  })
  y -= 22

  page1.drawLine({
    start: { x: margin, y },
    end: { x: A4[0] - margin, y },
    thickness: 1,
    color: rgb(0.82, 0.88, 0.86),
  })
  y -= 25

  page1.drawText(petition.title.en, {
    x: margin,
    y,
    size: 16,
    font: boldFont,
    color: rgb(0.08, 0.12, 0.17),
  })
  y -= 20

  page1.drawText(petition.recipientDetails.en, {
    x: margin,
    y,
    size: 10,
    font: fallbackFont,
    color: rgb(0.35, 0.4, 0.45),
  })
  y -= 24

  const bodyWords = petition.body.en.split(' ')
  let line = ''
  for (const word of bodyWords) {
    const testLine = line ? `${line} ${word}` : word
    if (fallbackFont.widthOfTextAtSize(testLine, 10) > A4[0] - margin * 2) {
      page1.drawText(line, { x: margin, y, size: 10, font: fallbackFont, color: rgb(0.12, 0.16, 0.22) })
      y -= 15
      line = word
    } else {
      line = testLine
    }
  }
  if (line) {
    page1.drawText(line, { x: margin, y, size: 10, font: fallbackFont, color: rgb(0.12, 0.16, 0.22) })
    y -= 25
  }

  page1.drawText('Requested Actions:', { x: margin, y, size: 12, font: boldFont, color: rgb(0.02, 0.31, 0.24) })
  y -= 18

  petition.requestedActions.forEach((act, idx) => {
    page1.drawText(`${idx + 1}. ${act.en}`, { x: margin, y, size: 9.5, font: fallbackFont, color: rgb(0.12, 0.16, 0.22) })
    y -= 18
  })

  // Page 2: Signatures
  const page2 = pdf.addPage(A4)
  let y2 = A4[1] - margin

  page2.drawText(`Signature Register · ${mockSubmissions.length} Valid Signatures`, {
    x: margin,
    y: y2,
    size: 13,
    font: boldFont,
    color: rgb(0.02, 0.31, 0.24),
  })
  y2 -= 30

  // Draw signature boxes
  const pngBytes = Uint8Array.from(atob(sampleSignaturePng.split(',')[1]), (c) => c.charCodeAt(0))
  const embeddedSig = await pdf.embedPng(pngBytes)

  for (const [idx, sub] of mockSubmissions.entries()) {
    page2.drawRectangle({
      x: margin,
      y: y2 - 60,
      width: A4[0] - margin * 2,
      height: 60,
      borderColor: rgb(0.85, 0.88, 0.9),
      borderWidth: 0.8,
    })

    page2.drawText(`${idx + 1}. ${sub.residentName}`, {
      x: margin + 10,
      y: y2 - 18,
      size: 10,
      font: boldFont,
      color: rgb(0.08, 0.12, 0.17),
    })

    page2.drawText(sub.houseName, {
      x: margin + 10,
      y: y2 - 32,
      size: 8.5,
      font: fallbackFont,
      color: rgb(0.35, 0.4, 0.45),
    })

    page2.drawText(`${sub.wardName} · ${sub.reference}`, {
      x: margin + 10,
      y: y2 - 46,
      size: 8,
      font: fallbackFont,
      color: rgb(0.35, 0.4, 0.45),
    })

    page2.drawImage(embeddedSig, {
      x: A4[0] - margin - 130,
      y: y2 - 55,
      width: 110,
      height: 45,
    })

    y2 -= 72
  }

  // Footer for each page
  const pages = [page1, page2]
  pages.forEach((p, idx) => {
    p.drawLine({
      start: { x: margin, y: 30 },
      end: { x: A4[0] - margin, y: 30 },
      thickness: 0.5,
      color: rgb(0.82, 0.88, 0.86),
    })
    p.drawText(`Page ${idx + 1} of ${pages.length} · Amballur Grama Panchayat Community Petition`, {
      x: margin,
      y: 18,
      size: 7.5,
      font: customFont || fallbackFont,
      color: rgb(0.4, 0.45, 0.5),
    })
  })

  const pdfBytes = await pdf.save()
  const blob = new Blob([pdfBytes as Uint8Array<ArrayBuffer>], { type: 'application/pdf' })
  return URL.createObjectURL(blob)
}
