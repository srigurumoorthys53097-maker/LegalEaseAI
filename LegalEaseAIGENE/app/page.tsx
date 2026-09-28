import { LegalEaseApp } from '@/components/legal-ease-app'
import { SiteHeader } from '@/components/site-header'

export default function Page() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex max-w-2xl flex-col gap-3">
          <h1 className="text-balance font-serif text-3xl font-semibold leading-tight sm:text-4xl">
            Draft professional legal documents in seconds
          </h1>
          <p className="text-pretty text-muted-foreground">
            Enter the parties, key terms, and effective date. LegalEase drafts a structured document you can review, edit,
            and export as a branded PDF, Word file, or plain text.
          </p>
        </div>
        <LegalEaseApp />
      </main>
      <footer className="border-t border-border">
        <p className="mx-auto max-w-7xl px-4 py-5 text-xs text-muted-foreground sm:px-6">
          LegalEase creates AI-generated drafts for informational purposes only and does not provide legal advice. Have a
          qualified professional review documents before signing.
        </p>
      </footer>
    </div>
  )
}
