import { AdminView } from "@/components/admin/admin-view"
import { PageShell } from "@/components/page-shell"

export default function AdminPage() {
  return (
    <PageShell
      title="Admin"
      description="Staging queue and catalog ingest controls."
    >
      <AdminView />
    </PageShell>
  )
}
