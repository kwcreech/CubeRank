import { notFound } from "next/navigation"
import { Suspense } from "react"

import { PageShell } from "@/components/page-shell"
import { ProfileView } from "@/components/profile/profile-view"
import { getPublicProfile } from "@/lib/api/client"
import { ApiError, type PublicProfile } from "@/lib/types/api"

type ProfilePageProps = {
  params: Promise<{ username: string }>
  searchParams: Promise<{ page?: string }>
}

export default async function ProfilePage({
  params,
  searchParams,
}: ProfilePageProps) {
  const { username } = await params
  const { page: pageParam } = await searchParams
  const page = Math.max(0, Number(pageParam ?? "0") || 0)

  let profile: PublicProfile

  try {
    profile = await getPublicProfile(username, { page, size: 5 })
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound()
    }
    throw err
  }

  return (
    <PageShell>
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Loading…</p>}
      >
        <ProfileView profile={profile} />
      </Suspense>
    </PageShell>
  )
}
