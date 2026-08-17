export type LegalSection = {
  heading: string
  body: string
}

export type LegalDocument = {
  title: string
  lastUpdated: string
  sections: LegalSection[]
}
