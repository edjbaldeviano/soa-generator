import {
  Document, Table, TableRow, TableCell, Paragraph, TextRun,
  WidthType, AlignmentType, BorderStyle, convertMillimetersToTwip,
  Packer, PageOrientation,
} from 'docx'
import { saveAs } from 'file-saver'
import { amountToWords } from './useAmountWords.js'

// ─── Constants ────────────────────────────────────────────────────────────────

const FONT = 'Arial'
const FONT_SIZE = 20 // half-points → 10pt

const BORDER_DEF = { style: BorderStyle.SINGLE, size: 4, color: '000000' }
const ALL_BORDERS = {
  top: BORDER_DEF,
  bottom: BORDER_DEF,
  left: BORDER_DEF,
  right: BORDER_DEF,
}
const NO_BORDERS = {
  top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
}

const MONTHS = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
]

// ─── Exported helpers (also used for testing) ─────────────────────────────────

export function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return `${MONTHS[month - 1]} ${day}, ${year}`
}

export function formatAmount(n) {
  return Number(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// ─── Document building helpers ─────────────────────────────────────────────────

function run(text) {
  return new TextRun({ text: String(text ?? ''), font: FONT, bold: true, size: FONT_SIZE })
}

function para(text, alignment = AlignmentType.LEFT) {
  return new Paragraph({ children: [run(text)], alignment })
}

function cell(content, opts = {}) {
  const { width, span, align = AlignmentType.LEFT, borders = ALL_BORDERS } = opts
  const children = Array.isArray(content) ? content : [para(content, align)]
  return new TableCell({
    children,
    ...(width !== undefined ? { width: { size: width, type: WidthType.PERCENTAGE } } : {}),
    ...(span !== undefined ? { columnSpan: span } : {}),
    borders,
  })
}

function fullRow(text) {
  return new TableRow({ children: [cell(text)] })
}

function makeTable(rows) {
  return new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } })
}

// ─── Table builders ────────────────────────────────────────────────────────────

function buildHeaderTable({ clientName, date, address }) {
  return makeTable([
    new TableRow({ children: [
      cell(clientName, { width: 60 }),
      cell(formatDate(date), { width: 40 }),
    ]}),
    new TableRow({ children: [
      cell('', { width: 60, borders: NO_BORDERS }),
      cell(address, { width: 40 }),
    ]}),
  ])
}

function buildMainTable(formData) {
  const { type, passengers, refType, refs, itinerary, fees, currency } = formData
  const n = passengers.length
  const paxWidth = (i) => i < n - 1 ? Math.floor(100 / n) : 100 - Math.floor(100 / n) * (n - 1)

  const rows = []

  // Passenger(s) header
  rows.push(fullRow('Passenger(s)'))

  // Passenger name cells
  rows.push(new TableRow({ children: passengers.map((name, i) =>
    cell(name, { width: paxWidth(i) })
  )}))

  if (type === 'airfare') {
    // Booking reference label
    rows.push(fullRow(refType))

    // Booking reference values (one per passenger)
    rows.push(new TableRow({ children: passengers.map((_, i) =>
      cell(refs[i] || '', { width: paxWidth(i) })
    )}))

    // Itinerary row: label | multi-paragraph content
    const itinParas = [
      para(`${itinerary.airline} ${itinerary.flightNumber}`),
      para(itinerary.route),
      para(`${itinerary.travelDate}  ${itinerary.depTime}  ${itinerary.arrTime}`),
      para(itinerary.travelClass),
    ]
    rows.push(new TableRow({ children: [
      cell('Itinerary:', { width: 15 }),
      cell(itinParas, { width: 85 }),
    ]}))
  }

  // Fee row: 6 columns, each cell has stacked paragraphs (one per fee item)
  rows.push(new TableRow({ children: [
    cell(fees.map((f) => para(f.description)),                                               { width: 35 }),
    cell(fees.map(() => para(currency)),                                                     { width: 8 }),
    cell(fees.map((f) => para(formatAmount(f.unitAmount), AlignmentType.RIGHT)),             { width: 15 }),
    cell(fees.map(() => para('X', AlignmentType.CENTER)),                                    { width: 7 }),
    cell(fees.map((f) => para(String(f.qty), AlignmentType.CENTER)),                        { width: 8 }),
    cell(fees.map((f) => para(formatAmount(Number(f.unitAmount) * Number(f.qty)), AlignmentType.RIGHT)), { width: 27 }),
  ]}))

  // Nothing Follows
  rows.push(fullRow('***** Nothing Follows *****'))

  return makeTable(rows)
}

function buildNoteTable(note) {
  return makeTable([
    new TableRow({ children: [
      cell('Note:', { width: 20 }),
      cell(note.trim(), { width: 80 }),
    ]}),
  ])
}

function buildTotalTable({ fees, currency }) {
  const total = fees.reduce((sum, f) => sum + Number(f.unitAmount) * Number(f.qty), 0)
  return makeTable([
    new TableRow({ children: [
      cell('', { width: 60, borders: NO_BORDERS }),
      cell(`${currency} ${formatAmount(total)}`, { width: 40, align: AlignmentType.RIGHT }),
    ]}),
    new TableRow({ children: [cell(amountToWords(total, currency))] }),
  ])
}

function buildSignatureTable() {
  return makeTable([
    new TableRow({ children: [
      cell('EDWARD DANIEL J. BALDEVIANO', { width: 50 }),
      cell('ELENA J. BALDEVIANO', { width: 50 }),
    ]}),
  ])
}

// ─── Main export ───────────────────────────────────────────────────────────────

export async function generateSoa(formData) {
  const tables = [
    buildHeaderTable(formData),
    buildMainTable(formData),
  ]
  if (formData.note && formData.note.trim()) {
    tables.push(buildNoteTable(formData.note))
  }
  tables.push(buildTotalTable(formData))
  tables.push(buildSignatureTable())

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: {
            orientation: PageOrientation.PORTRAIT,
            width: convertMillimetersToTwip(210),
            height: convertMillimetersToTwip(297),
          },
          margin: {
            top: convertMillimetersToTwip(12.7),
            right: convertMillimetersToTwip(12.7),
            bottom: convertMillimetersToTwip(12.7),
            left: convertMillimetersToTwip(12.7),
          },
        },
      },
      children: tables,
    }],
  })

  const blob = await Packer.toBlob(doc)
  const slug = formData.clientName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40)
  saveAs(blob, `soa-${slug}-${formData.date}.docx`)
}
