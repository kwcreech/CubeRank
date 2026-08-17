"use client"

import type { ReactNode } from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { PRIVACY_POLICY, TERMS_OF_SERVICE } from "@/content/legal"
import { cn } from "@/lib/utils"

const DOCUMENTS = {
  terms: TERMS_OF_SERVICE,
  privacy: PRIVACY_POLICY,
} as const

export type LegalDocumentKey = keyof typeof DOCUMENTS

export function LegalDocumentLink({
  document,
  children,
  className,
}: {
  document: LegalDocumentKey
  children: ReactNode
  className?: string
}) {
  const legalDocument = DOCUMENTS[document]

  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            type="button"
            className={cn(
              "inline p-0 font-medium text-primary underline-offset-4 hover:underline",
              className
            )}
          />
        }
      >
        {children}
      </DialogTrigger>
      <DialogContent className="flex max-h-[85vh] flex-col overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{legalDocument.title}</DialogTitle>
          <DialogDescription>
            Last updated {legalDocument.lastUpdated}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="flex flex-col gap-4 pb-2">
            {legalDocument.sections.map((section) => (
              <section key={section.heading} className="flex flex-col gap-1.5">
                <h3 className="font-medium text-foreground">{section.heading}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {section.body}
                </p>
              </section>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
