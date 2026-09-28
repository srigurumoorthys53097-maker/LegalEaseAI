'use client'

import { useState } from 'react'
import { Check, Copy, Eye, FileDown, FileText, FileType, Loader2, Pencil, Scale } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { parseBlocks } from '@/lib/document'
import { exportDocx, exportPdf, exportTxt } from '@/lib/export'

type Props = {
  text: string
  onTextChange: (text: string) => void
  docType: string
  terms: string
  loading: boolean
  error: string | null
  model: string | null
}

type Format = 'txt' | 'docx' | 'pdf'

export function DocumentPreview({ text, onTextChange, docType, terms, loading, error, model }: Props) {
  const [editing, setEditing] = useState(false)
  const [exporting, setExporting] = useState<Format | null>(null)
  const [copied, setCopied] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const download = async (format: Format) => {
    setExporting(format)
    setExportError(null)
    try {
      if (format === 'txt') exportTxt(text, docType)
      else if (format === 'docx') await exportDocx(text, docType, terms)
      else await exportPdf(text, docType, terms)
    } catch {
      setExportError(`Could not create the .${format} file. Please try again.`)
    } finally {
      setExporting(null)
    }
  }

  const copy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const hasDoc = text.trim().length > 0

  return (
    <section aria-labelledby="preview-heading" className="flex min-h-[640px] flex-col rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
        <div className="flex flex-col">
          <h2 id="preview-heading" className="font-serif text-lg font-semibold">
            Document preview
          </h2>
          {model && hasDoc && <span className="text-xs text-muted-foreground">Drafted with {model}</span>}
        </div>
        {hasDoc && (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditing((e) => !e)} disabled={loading}>
              {editing ? <Eye aria-hidden /> : <Pencil aria-hidden />}
              {editing ? 'Preview' : 'Edit document'}
            </Button>
            <Button variant="ghost" size="sm" onClick={copy} disabled={loading}>
              {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-6">
        {error && (
          <div role="alert" className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {loading ? (
          <LoadingState />
        ) : !hasDoc ? (
          <EmptyState />
        ) : editing ? (
          <textarea
            aria-label="Edit document text"
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            className="min-h-[520px] w-full flex-1 resize-y rounded-lg bg-paper p-6 font-serif text-[15px] leading-relaxed text-paper-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
        ) : (
          <RenderedDocument text={text} />
        )}
      </div>

      {hasDoc && !loading && (
        <div className="flex flex-col gap-2 border-t border-border px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-sm text-muted-foreground">Download:</span>
            <Button variant="secondary" onClick={() => download('txt')} disabled={exporting !== null}>
              {exporting === 'txt' ? <Loader2 className="animate-spin" aria-hidden /> : <FileText aria-hidden />}
              .TXT
            </Button>
            <Button variant="secondary" onClick={() => download('docx')} disabled={exporting !== null}>
              {exporting === 'docx' ? <Loader2 className="animate-spin" aria-hidden /> : <FileType aria-hidden />}
              .DOCX
            </Button>
            <Button onClick={() => download('pdf')} disabled={exporting !== null}>
              {exporting === 'pdf' ? <Loader2 className="animate-spin" aria-hidden /> : <FileDown aria-hidden />}
              .PDF
            </Button>
          </div>
          {exportError && (
            <p role="alert" className="text-sm text-destructive">
              {exportError}
            </p>
          )}
        </div>
      )}
    </section>
  )
}

function RenderedDocument({ text }: { text: string }) {
  const blocks = parseBlocks(text)
  return (
    <article className="max-h-[640px] overflow-y-auto rounded-lg bg-paper px-6 py-8 font-serif text-paper-foreground shadow-inner sm:px-10">
      {blocks.map((block, i) => {
        if (block.kind === 'title')
          return (
            <h3 key={i} className="mb-6 text-balance text-center text-xl font-bold tracking-wide">
              {block.text}
            </h3>
          )
        if (block.kind === 'heading')
          return (
            <h4 key={i} className="mb-2 mt-6 text-sm font-bold uppercase tracking-wider">
              {block.text}
            </h4>
          )
        if (block.kind === 'bullet')
          return (
            <p key={i} className="mb-1.5 flex gap-2 pl-4 text-[15px] leading-relaxed">
              <span aria-hidden>{'\u2022'}</span>
              <span>{block.text}</span>
            </p>
          )
        return (
          <p key={i} className="mb-3 text-pretty text-[15px] leading-relaxed">
            {block.text}
          </p>
        )
      })}
    </article>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border p-10 text-center">
      <Scale className="size-10 text-primary" aria-hidden />
      <p className="font-serif text-lg">Your document will appear here</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        Fill in the details or pick an example, then click Generate. You can edit the result and download it as TXT, DOCX,
        or PDF.
      </p>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-1 flex-col gap-3 rounded-lg bg-paper/95 p-8" aria-live="polite" aria-busy="true">
      <span className="sr-only">Generating document</span>
      <div className="mx-auto mb-4 h-5 w-1/2 animate-pulse rounded bg-paper-foreground/15" />
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="h-3 animate-pulse rounded bg-paper-foreground/10"
          style={{ width: `${[92, 85, 97, 60, 88, 94, 72, 90, 83, 96, 65, 78][i]}%` }}
        />
      ))}
    </div>
  )
}
