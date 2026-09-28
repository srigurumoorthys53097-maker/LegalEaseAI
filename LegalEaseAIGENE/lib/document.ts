export type DocumentRequest = {
  documentType: string
  parties: string
  terms: string
  effectiveDate: string
  jurisdiction?: string
}

export type Block =
  | { kind: 'title'; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'bullet'; text: string }
  | { kind: 'paragraph'; text: string }

export function sanitizeText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/\u00A0/g, ' ')
    .replace(/^```[a-z]*\s*$/gim, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[^\S\n]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function splitTerms(terms: string): string[] {
  return terms
    .split(';')
    .map((t) => t.trim())
    .filter(Boolean)
}

function isHeading(line: string): boolean {
  if (line.length > 90) return false
  const letters = line.replace(/[^a-zA-Z]/g, '')
  if (letters.length >= 3 && letters === letters.toUpperCase()) return true
  if (/^(article|section)\s+[\dIVXLC]+/i.test(line)) return true
  if (/^\d+\.\s+[A-Z][^.]{0,60}$/.test(line)) return true
  return false
}

export function parseBlocks(text: string): Block[] {
  const lines = sanitizeText(text)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  return lines.map((line, index): Block => {
    if (index === 0) return { kind: 'title', text: line }
    const bullet = line.match(/^(?:[-*\u2022]|\([a-z0-9]+\))\s+(.*)$/i)
    if (bullet) return { kind: 'bullet', text: bullet[1] }
    if (isHeading(line)) return { kind: 'heading', text: line.replace(/:$/, '') }
    return { kind: 'paragraph', text: line }
  })
}

export function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'legal-document'
  )
}
