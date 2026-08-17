import { LegalDocumentLink } from "@/components/legal/legal-document-link"

export function SiteFooter() {
  return (
    <footer className="border-t border-border/80 bg-background">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6">
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} CubeRank
        </p>
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          <LegalDocumentLink
            document="terms"
            className="font-normal text-muted-foreground hover:text-foreground"
          >
            Terms of Service
          </LegalDocumentLink>
          <LegalDocumentLink
            document="privacy"
            className="font-normal text-muted-foreground hover:text-foreground"
          >
            Privacy Policy
          </LegalDocumentLink>
        </nav>
      </div>
    </footer>
  )
}
