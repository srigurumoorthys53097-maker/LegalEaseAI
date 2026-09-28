import { sanitizeText, splitTerms } from '@/lib/document'

export const maxDuration = 60

const MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-3.5-flash',
  'gemini-flash-latest',
  'gemini-3.1-flash-lite',
  'gemini-flash-lite-latest',
].filter((m, i, all): m is string => Boolean(m) && all.indexOf(m) === i)

const LIMITS = { documentType: 120, parties: 1000, terms: 4000, effectiveDate: 80, jurisdiction: 120 }

type Field = keyof typeof LIMITS

function readField(body: Record<string, unknown>, key: Field, required: boolean) {
  const raw = body[key]
  const value = typeof raw === 'string' ? raw.trim() : ''
  if (required && !value) return { error: `"${key}" is required.` }
  if (value.length > LIMITS[key]) return { error: `"${key}" must be at most ${LIMITS[key]} characters.` }
  return { value }
}

function buildPrompt(input: Record<Field, string>) {
  const terms = splitTerms(input.terms)
    .map((t, i) => `${i + 1}. ${t}`)
    .join('\n')

  return `You are an experienced legal drafting assistant. Draft a complete, professional "${input.documentType}".

Parties involved: ${input.parties}
Effective date: ${input.effectiveDate}
Governing law / jurisdiction: ${input.jurisdiction || 'Not specified - use a neutral placeholder such as [Jurisdiction]'}
Key terms that MUST be incorporated as clauses:
${terms}

Formatting rules (follow strictly):
- Plain text only. Do NOT use Markdown (no #, no **, no tables, no code fences).
- First line: the document title in ALL CAPS.
- Then an opening paragraph identifying the parties and effective date.
- Organize the body into numbered sections with ALL CAPS headings on their own line, e.g. "1. DEFINITIONS".
- Use "- " at the start of a line for list items.
- Include standard clauses appropriate for this document type (e.g. term, termination, confidentiality, governing law, dispute resolution, entire agreement, severability).
- End with a signature block for every party with lines for Name, Title, Signature and Date.
- Use square-bracket placeholders like [Address] for any information not provided. Never invent specific personal data.`
}

async function callGemini(model: string, prompt: string, apiKey: string) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 8192 },
      }),
    },
  )
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    return { ok: false as const, status: res.status, message: data?.error?.message ?? 'Unknown Gemini error' }
  }
  const text: string =
    data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? ''
  if (!text.trim()) return { ok: false as const, status: 502, message: 'Gemini returned an empty response.' }
  return { ok: true as const, text }
}

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return Response.json({ error: 'GEMINI_API_KEY is not configured on the server.' }, { status: 500 })
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  if (!body || typeof body !== 'object') {
    return Response.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const input = {} as Record<Field, string>
  for (const [key, required] of [
    ['documentType', true],
    ['parties', true],
    ['terms', true],
    ['effectiveDate', true],
    ['jurisdiction', false],
  ] as const) {
    const result = readField(body, key, required)
    if ('error' in result) return Response.json({ error: result.error }, { status: 400 })
    input[key] = result.value
  }

  const prompt = buildPrompt(input)
  let lastError = { status: 502, message: 'Unable to generate the document.' }

  for (const model of MODELS) {
    const result = await callGemini(model, prompt, apiKey)
    if (result.ok) {
      return Response.json({ document: sanitizeText(result.text), model })
    }
    lastError = { status: result.status, message: result.message }
    if (result.status === 400 || result.status === 401 || result.status === 403) break
  }

  const status = lastError.status === 401 || lastError.status === 403 ? 500 : 502
  return Response.json({ error: `Gemini error: ${lastError.message}` }, { status })
}
