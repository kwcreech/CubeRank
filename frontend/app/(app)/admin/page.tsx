import { AdminView } from "@/components/admin/admin-view"
import { PageShell } from "@/components/page-shell"

export default function AdminPage() {
  return (
    <PageShell
      title="Admin"
      description="Staging queue, catalog ingest, and embedding backfill."
    >
      <AdminView />
    </PageShell>
  )
}
