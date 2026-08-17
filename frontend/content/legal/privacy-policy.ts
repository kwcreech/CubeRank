import type { LegalDocument } from "./types"

export const PRIVACY_POLICY: LegalDocument = {
  title: "Privacy Policy",
  lastUpdated: "August 17, 2026",
  sections: [
    {
      heading: "Introduction",
      body: 'CubeRank ("we", "us", or "our") operates a community review site for speedcubes. This Privacy Policy describes what information we collect, how we use it, and the choices you have.',
    },
    {
      heading: "Account information",
      body: "We collect email addresses through Supabase strictly for authentication and password resets. Emails are never sold, rented, or used for marketing.",
    },
    {
      heading: "User-generated content",
      body: "We collect user-generated content that you choose to provide, including usernames, written reviews, 1–10 slider ratings (controllability, stability, turning, customizability, and value), optional YouTube links, and optional profile avatars stored in Supabase Storage.",
    },
    {
      heading: "AI processing",
      body: "We use OpenAI's API to generate mathematical vector embeddings of written reviews for our search and recommendation features. OpenAI does not use our API data to train their models. If you use the in-app assistant, your question is also sent to OpenAI to retrieve similar reviews and generate an answer.",
    },
    {
      heading: "How we use data",
      body: "We use the information we collect to operate your account, display reviews and leaderboards, power search and recommendations, and keep the service secure.",
    },
    {
      heading: "Storage and processors",
      body: "Authentication and file storage are provided by Supabase. Application data is stored on our backend and database. Embeddings and assistant requests are processed by OpenAI.",
    },
    {
      heading: "Account and data deletion",
      body: "You may request deletion of your account and associated data at any time. We will delete or anonymize personal data we control, except where we must retain it for security or legal reasons.",
    },
    {
      heading: "Children",
      body: "CubeRank is not directed at children under 13, and we do not knowingly collect personal information from children under 13.",
    },
    {
      heading: "Changes",
      body: 'We may update this Privacy Policy from time to time. The "Last updated" date at the top of this document will change when we do.',
    },
  ],
}
