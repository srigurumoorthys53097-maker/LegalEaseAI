'use client'

import { Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { DocumentRequest } from '@/lib/document'

const DOCUMENT_TYPES = [
  'Non-Disclosure Agreement',
  'Employment Contract',
  'Residential Lease Agreement',
  'Freelance Work Contract',
  'Employment Offer Letter',
  'Service Agreement',
]

export const EXAMPLES: Record<string, DocumentRequest> = {
  'Freelance contract': {
    documentType: 'Freelance Work Contract',
    parties: 'Jane Doe (Service Provider), TechNova Inc. (Client)',
    terms:
      'Payment to be made within 30 days of invoice; The provider agrees to deliver work by the agreed deadline; Confidentiality must be maintained at all times; Either party may terminate with 15 days notice',
    effectiveDate: 'April 10, 2026',
    jurisdiction: 'State of California, USA',
  },
  NDA: {
    documentType: 'Non-Disclosure Agreement',
    parties: 'John Doe (Freelancer), ABC Corp (Client)',
    terms:
      'Confidentiality obligations last 2 years; No disclosure to third parties without written consent; All confidential materials must be returned on request',
    effectiveDate: 'May 1, 2026',
    jurisdiction: '',
  },
  Lease: {
    documentType: 'Residential Lease Agreement',
    parties: 'Alice Smith (Tenant), XYZ Realty (Landlord)',
    terms:
      'Property located at 42 Oak Street, Springfield; Monthly rent of $1,800 due on the 1st; Security deposit of one month rent; Lease term of 12 months; No pets without written approval',
    effectiveDate: 'June 1, 2026',
    jurisdiction: 'State of Illinois, USA',
  },
}

const inputClass =
  'w-full rounded-lg border border-input bg-background/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-60'

type Props = {
  value: DocumentRequest
  onChange: (value: DocumentRequest) => void
  onSubmit: () => void
  loading: boolean
}

export function DocumentForm({ value, onChange, onSubmit, loading }: Props) {
  const set = (key: keyof DocumentRequest) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ ...value, [key]: e.target.value })

  const termCount = value.terms.split(';').filter((t) => t.trim()).length

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
      className="flex flex-col gap-5 rounded-xl border border-border bg-card p-5 sm:p-6"
    >
      <div className="flex flex-col gap-1">
        <h2 className="font-serif text-xl font-semibold">Document details</h2>
        <p className="text-sm text-muted-foreground">Describe what you need and Gemini will draft it.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Try an example:</span>
        {Object.entries(EXAMPLES).map(([label, example]) => (
          <button
            key={label}
            type="button"
            disabled={loading}
            onClick={() => onChange(example)}
            className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="documentType" className="text-sm font-medium">
          Document type
        </label>
        <input
          id="documentType"
          list="document-types"
          required
          maxLength={120}
          disabled={loading}
          value={value.documentType}
          onChange={set('documentType')}
          placeholder="e.g. Non-Disclosure Agreement"
          className={inputClass}
        />
        <datalist id="document-types">
          {DOCUMENT_TYPES.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="parties" className="text-sm font-medium">
          Parties involved
        </label>
        <textarea
          id="parties"
          required
          rows={2}
          maxLength={1000}
          disabled={loading}
          value={value.parties}
          onChange={set('parties')}
          placeholder="e.g. Jane Doe (Service Provider), TechNova Inc. (Client)"
          className={`${inputClass} resize-y`}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <label htmlFor="terms" className="text-sm font-medium">
            Terms and conditions
          </label>
          <span className="text-xs text-muted-foreground">
            {termCount} {termCount === 1 ? 'term' : 'terms'}
          </span>
        </div>
        <textarea
          id="terms"
          required
          rows={5}
          maxLength={4000}
          disabled={loading}
          value={value.terms}
          onChange={set('terms')}
          placeholder="Payment within 30 days of invoice; Confidentiality at all times; ..."
          aria-describedby="terms-hint"
          className={`${inputClass} resize-y`}
        />
        <p id="terms-hint" className="text-xs text-muted-foreground">
          Separate each clause with a semicolon (;).
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="effectiveDate" className="text-sm font-medium">
            Effective date
          </label>
          <input
            id="effectiveDate"
            required
            maxLength={80}
            disabled={loading}
            value={value.effectiveDate}
            onChange={set('effectiveDate')}
            placeholder="e.g. April 10, 2026"
            className={inputClass}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="jurisdiction" className="text-sm font-medium">
            Jurisdiction <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <input
            id="jurisdiction"
            maxLength={120}
            disabled={loading}
            value={value.jurisdiction ?? ''}
            onChange={set('jurisdiction')}
            placeholder="e.g. State of New York"
            className={inputClass}
          />
        </div>
      </div>

      <Button type="submit" size="lg" disabled={loading} className="h-10 w-full text-sm">
        {loading ? <Loader2 className="animate-spin" aria-hidden /> : <Sparkles aria-hidden />}
        {loading ? 'Drafting your document...' : 'Generate document'}
      </Button>
    </form>
  )
}
