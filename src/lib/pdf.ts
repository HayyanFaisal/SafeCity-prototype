import { SITE_NAME } from '../constants'
import { formatTimestamp } from './format'
import type { IncidentLogRow } from '../types'

const REPORT_CSS = `
  * { box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #111827; margin: 32px; }
  .head { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #0B0F19; padding-bottom: 12px; }
  h1 { font-size: 20px; margin: 0; }
  .sub { color: #4B5563; font-size: 12px; margin-top: 4px; }
  .report-title { text-align: right; font-size: 13px; }
  .badges { display: flex; gap: 10px; margin: 18px 0; }
  .badge { border: 1px solid #111827; padding: 6px 12px; font-size: 12px; border-radius: 4px; background: #F3F4F6; }
  table { width: 100%; border-collapse: collapse; font-size: 11.5px; margin-top: 8px; }
  th { background: #0B0F19; color: #fff; text-align: left; padding: 7px 6px; font-size: 10.5px; letter-spacing: 0.4px; text-transform: uppercase; }
  td { border: 1px solid #D1D5DB; padding: 6px; }
  tr:nth-child(even) td { background: #F9FAFB; }
  .sev-high { color: #B91C1C; font-weight: 700; }
  .sev-medium { color: #B45309; font-weight: 700; }
  .sev-low { color: #0E7490; font-weight: 700; }
  .footer { margin-top: 26px; font-size: 11px; color: #6B7280; display: flex; justify-content: space-between; }
  .sign { margin-top: 40px; display: flex; justify-content: space-between; font-size: 12px; }
  .sign div { width: 260px; }
  .sign .line { border-top: 1px solid #111827; margin-top: 44px; padding-top: 6px; text-align: center; }
`

function el<K extends keyof HTMLElementTagNameMap>(
  doc: Document,
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = doc.createElement(tag)
  if (className) node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

/**
 * Builds a printable incident report using the browser DOM (textContent —
 * no string escaping) and downloads it. Labelled ".pdf" as the signed-off
 * official print export — opens in any browser to print/save as PDF.
 */
export function downloadIncidentReport(rows: IncidentLogRow[]): void {
  const generatedAt = formatTimestamp(new Date())
  const totalFines = rows.filter((r) => r.fined).length
  const high = rows.filter((r) => r.severity === 'high').length
  const medium = rows.filter((r) => r.severity === 'medium').length
  const low = rows.filter((r) => r.severity === 'low').length

  const doc = document.implementation.createHTMLDocument('Incident Report')
  const style = el(doc, 'style')
  style.textContent = REPORT_CSS
  doc.head.appendChild(style)

  // Header
  const head = el(doc, 'div', 'head')
  const headLeft = el(doc, 'div')
  headLeft.appendChild(el(doc, 'h1', undefined, `${SITE_NAME} — AI Safe City Command Center`))
  headLeft.appendChild(el(doc, 'div', 'sub', `Official Incident Fine Report • Generated ${generatedAt} • AUTOMATED AI ENGINE v4.2`))
  head.appendChild(headLeft)
  head.appendChild(el(doc, 'div', 'report-title', 'FORM SCC/IR-2026\nCOMMAND CENTER USE'))
  doc.body.appendChild(head)

  // Summary badges
  const badges = el(doc, 'div', 'badges')
  const badgeData: Array<[string, string]> = [
    ['TOTAL EVENTS', String(rows.length)],
    ['HIGH', String(high)],
    ['MEDIUM', String(medium)],
    ['LOW', String(low)],
    ['FINES ISSUED', String(totalFines)],
  ]
  for (const [label, value] of badgeData) {
    const b = el(doc, 'div', 'badge', `${label}: ${value}`)
    badges.appendChild(b)
  }
  doc.body.appendChild(badges)

  // Table
  const headers = ['#', 'Severity', 'Timestamp', 'Camera ID', 'IP Address', 'Camera Name', 'Event', 'Plate / Vehicle', 'Confidence', 'Fine Issued']
  const table = el(doc, 'table')
  const thead = el(doc, 'thead')
  const headRow = el(doc, 'tr')
  for (const h of headers) headRow.appendChild(el(doc, 'th', undefined, h))
  thead.appendChild(headRow)
  table.appendChild(thead)

  const tbody = el(doc, 'tbody')
  rows.forEach((r, i) => {
    const tr = el(doc, 'tr')
    const sevClass = r.severity === 'high' ? 'sev-high' : r.severity === 'medium' ? 'sev-medium' : 'sev-low'
    const values = [
      String(i + 1),
      r.severity.toUpperCase(),
      r.timestamp,
      r.cameraId,
      r.ip,
      r.cameraName,
      r.event,
      r.plate ? `${r.plate}${r.vehicle ? ` (${r.vehicle})` : ''}` : '—',
      `${r.confidence.toFixed(1)}%`,
      r.fined ? 'YES' : r.fined === false ? '—' : '',
    ]
    values.forEach((v, vi) => {
      const td = el(doc, 'td', vi === 1 ? sevClass : undefined, v)
      tr.appendChild(td)
    })
    tbody.appendChild(tr)
  })
  table.appendChild(tbody)
  doc.body.appendChild(table)

  // Footer + signatures
  const footer = el(doc, 'div', 'footer')
  footer.appendChild(el(doc, 'span', undefined, 'Confidential — authorized law-enforcement & society security personnel only.'))
  footer.appendChild(el(doc, 'span', undefined, 'Page 1 of 1'))
  doc.body.appendChild(footer)

  const sign = el(doc, 'div', 'sign')
  const seals = ['Command Center Supervisor', 'Society Security Officer']
  for (const who of seals) {
    const box = el(doc, 'div')
    box.appendChild(el(doc, 'div', 'line', who))
    sign.appendChild(box)
  }
  const hash = Math.floor(Math.random() * 1_000_000).toString(16).toUpperCase().padStart(6, '0')
  const sealBox = el(doc, 'div')
  sealBox.appendChild(el(doc, 'div', 'line', `AI Verification Seal (hash ${hash})`))
  sign.appendChild(sealBox)
  doc.body.appendChild(sign)

  const html = `<!doctype html>${new XMLSerializer().serializeToString(doc.documentElement)}`
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Incident-Fine-Report_${generatedAt.replace(/[:T]/g, '-')}.pdf`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 4000)
}
