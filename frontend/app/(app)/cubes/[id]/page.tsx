import { notFound } from "next/navigation"

import { CubeDetailView } from "@/components/cubes/cube-detail-view"
import { PageShell } from "@/components/page-shell"
import { getCube, listCubeReviews } from "@/lib/api/client"
import { ApiError, type CubeDetail, type Review } from "@/lib/types/api"

type CubePageProps = {
  params: Promise<{ id: string }>
}

export default async function CubePage({ params }: CubePageProps) {
  const { id } = await params

  if (!/^\d+$/.test(id)) {
    notFound()
  }

  let cube: CubeDetail
  let reviews: Review[]

  try {
    const [cubeData, reviewsPage] = await Promise.all([
      getCube(id),
      listCubeReviews(id, { size: 3 }),
    ])
    cube = cubeData
    reviews = reviewsPage.items
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound()
    }
    throw err
  }

  return (
    <PageShell>
      <CubeDetailView cube={cube} reviews={reviews} />
    </PageShell>
  )
}
