import {
  Document, Table, TableRow, TableCell, Paragraph, TextRun,
  WidthType, AlignmentType, BorderStyle, HeightRule, convertMillimetersToTwip,
  Packer, PageOrientation,
} from 'docx'
import { saveAs } from 'file-saver'
import { amountToWords } from './useAmountWords.js'

// ─── Constants ────────────────────────────────────────────────────────────────

const FONT = 'Arial'
const FONT_SIZE = 20 // half-points → 10pt

const NO_BORDERS = {
  top:    { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left:   { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right:  { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
}

const NO_TABLE_BORDERS = {
  top:              { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  bottom:           { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  left:             { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  right:            { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  insideVertical:   { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
}

const MONTHS = [
  'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
  'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
]

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

// ─── Exported helpers (also used for testing) ─────────────────────────────────

export function formatDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number)
  return `${MONTHS[month - 1]} ${day}, ${year}`
}

// Converts YYYY-MM-DD → "May 30" (for itinerary display)
function formatItineraryDate(dateStr) {
  if (!dateStr) return ''
  const [, month, day] = dateStr.split('-').map(Number)
  return `${SHORT_MONTHS[month - 1]} ${day}`
}

// Converts HH:MM (from <input type="time">) → "HHMM"
function formatTime(timeStr) {
  return (timeStr || '').replace(':', '')
}

export function formatAmount(n) {
  return Number(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// "MANILA (MNL), PHILIPPINES" → "MANILA"; plain names pass through unchanged
function extractCityName(str) {
  const parenIdx = str.indexOf(' (')
  return parenIdx !== -1 ? str.slice(0, parenIdx).trim() : str.trim()
}

// Builds the DOCX route string: city names only, joined by /
function computeRoute(routeType, airports) {
  const stops = airports.map((a) => extractCityName(a)).filter(Boolean)
  if (stops.length < 2) return stops.join('/')
  if (routeType === 'round-trip') return [...stops, stops[0]].join('/')
  return stops.join('/')
}

// ─── Document building helpers ─────────────────────────────────────────────────

function run(text, bold = true) {
  return new TextRun({ text: String(text ?? ''), font: FONT, bold, size: FONT_SIZE })
}

function para(text, alignment = AlignmentType.LEFT, bold = true) {
  return new Paragraph({ children: [run(text, bold)], alignment })
}

function cell(content, opts = {}) {
  const { width, span, align = AlignmentType.LEFT, borders = NO_BORDERS, height, bold = true } = opts
  const children = Array.isArray(content) ? content : [para(content, align, bold)]
  const c = new TableCell({
    children,
    ...(width !== undefined ? { width: { size: width, type: WidthType.PERCENTAGE } } : {}),
    ...(span !== undefined ? { columnSpan: span } : {}),
    borders,
  })
  if (height !== undefined) c._height = height
  return c
}

// Creates a TableRow, picking up height (in twips) from any cell's _height property.
function row(cells, opts = {}) {
  const height = opts.height ?? cells.find(c => c._height !== undefined)?._height
  return new TableRow({
    children: cells,
    ...(height !== undefined ? { height: { value: height, rule: HeightRule.ATLEAST } } : {}),
  })
}

function fullRow(text) {
  return new TableRow({ children: [cell(text)] })
}

function makeTable(rows) {
  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: NO_TABLE_BORDERS,
  })
}

// ─── Table builders ────────────────────────────────────────────────────────────

function buildClientRow({ clientName, date }) {
  return makeTable([
    new TableRow({ children: [
      cell(clientName, { width: 60 }),
      cell(formatDate(date), { width: 40 }),
    ]}),
  ])
}

function buildAddressRow({ address }) {
  return makeTable([
    new TableRow({ children: [
      cell(address, { width: 100 }),
    ]}),
  ])
}

function effectiveRefLabel(refType, refs) {
  const total = refs.reduce((sum, r) => sum + r.length, 0)
  if (refType === 'Ticket No.') return total > 1 ? 'Ticket Nos.' : 'Ticket No.'
  if (refType === 'Booking Reference No.') return total > 1 ? 'Booking Reference Nos.' : 'Booking Reference No.'
  return refType
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
    cell(name, { width: paxWidth(i), bold: false })
  )}))

  if (type === 'airfare') {
    // Booking reference label (auto-pluralised based on total ref count)
    rows.push(fullRow(effectiveRefLabel(refType, refs)))

    // Booking reference values (one per passenger; each refs[i] is string[])
    rows.push(new TableRow({ children: passengers.map((_, i) =>
      cell((refs[i] || ['']).map(t => para(t, AlignmentType.LEFT, false)), { width: paxWidth(i) })
    )}))

    // Itinerary row: label | multi-paragraph content
    const route = computeRoute(itinerary.routeType, itinerary.airports)
    const flightLine = itinerary.flights
      .map((f) => `${f.airline} ${f.flightNumber}`.trim())
      .join('/')
    const itinParas = [
      para(flightLine, AlignmentType.LEFT, false),
      para(route, AlignmentType.LEFT, false),
      para(`${formatItineraryDate(itinerary.travelDate)} ${formatTime(itinerary.depTime)} ${formatTime(itinerary.arrTime)}`, AlignmentType.LEFT, false),
      para(itinerary.travelClass, AlignmentType.LEFT, false),
    ]
    rows.push(new TableRow({ children: [
      cell('Itinerary:', { width: 15 }),
      cell(itinParas, { width: 85 }),
    ]}))
  }

  // Fee row: 6 columns, each cell has stacked paragraphs (one per fee item)
  rows.push(new TableRow({ children: [
    cell(fees.map((f) => para(f.description, AlignmentType.LEFT, false)), { width: 35 }),
    cell(fees.map(() => para(currency, AlignmentType.LEFT, false)), { width: 8 }),
    cell(fees.map((f) => para(formatAmount(f.unitAmount), AlignmentType.RIGHT, false)), { width: 15 }),
    cell(fees.map(() => para('X', AlignmentType.CENTER, false)), { width: 7 }),
    cell(fees.map((f) => para(String(f.qty), AlignmentType.CENTER, false)), { width: 8 }),
    cell(fees.map((f) => para(formatAmount(Number(f.unitAmount) * Number(f.qty)), AlignmentType.RIGHT, false)), { width: 27 }),
  ]}))

  // Nothing Follows
  rows.push(new TableRow({ children: [cell('***** Nothing Follows *****', { bold: false })] }))

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
      cell('', { width: 60 }),
      cell(`${currency} ${formatAmount(total)}`, { width: 40, align: AlignmentType.RIGHT }),
    ]}),
    new TableRow({ children: [cell(amountToWords(total, currency), { bold: false })] }),
  ])
}

function buildSignatureTable() {
  return makeTable([
    new TableRow({ children: [
      cell('EDWARD DANIEL J. BALDEVIANO', { width: 50, bold: false }),
      cell('ELENA J. BALDEVIANO', { width: 50, bold: false }),
    ]}),
  ])
}

// ─── Main export ───────────────────────────────────────────────────────────────

export async function generateSoa(formData) {
  const tables = [
    buildClientRow(formData),
    buildAddressRow(formData),
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
