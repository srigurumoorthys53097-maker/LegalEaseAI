'use client'

import { useState } from 'react'
import { DocumentForm, EXAMPLES } from '@/components/document-form'
import { DocumentPreview } from '@/components/document-preview'
import type { DocumentRequest } from '@/lib/document'

export function LegalEaseApp() {
  const [form, setForm] = useState<DocumentRequest>(EXAMPLES['Freelance contract'])
  const [submitted, setSubmitted] = useState<DocumentRequest | null>(null)
  const [text, setText] = useState('')
  const [model, setModel] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Something went wrong. Please try again.')
      setText(data.document)
      setModel(data.model ?? null)
      setSubmitted(form)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div className="lg:sticky lg:top-6 lg:self-start">
        <DocumentForm value={form} onChange={setForm} onSubmit={generate} loading={loading} />
      </div>
      <DocumentPreview
        text={text}
        onTextChange={setText}
        docType={submitted?.documentType ?? form.documentType}
        terms={submitted?.terms ?? form.terms}
        loading={loading}
        error={error}
        model={model}
      />
    </div>
  )
}
