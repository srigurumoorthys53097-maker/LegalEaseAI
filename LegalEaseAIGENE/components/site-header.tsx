import Image from 'next/image'

export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="" width={36} height={36} className="rounded-md" priority />
          <div className="flex flex-col">
            <span className="font-serif text-lg font-semibold leading-tight">LegalEase</span>
            <span className="text-xs text-muted-foreground">AI-powered legal document generator</span>
          </div>
        </div>
        <span className="hidden rounded-full border border-border px-3 py-1 text-xs text-muted-foreground sm:inline">
          Powered by Google Gemini
        </span>
      </div>
    </header>
  )
}
