import { PageShell } from "@/components/page-shell"

type ProfilePageProps = {
  params: Promise<{ username: string }>
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { username } = await params

  return (
    <PageShell
      title={`@${username}`}
      description="Public profile with reviews and top-rated cubes."
    />
  )
}
