import { PageShell } from "@/components/page-shell"
import { SettingsForm } from "@/components/settings/settings-form"

export default function SettingsPage() {
  return (
    <PageShell
      title="Settings"
      description="Update your avatar, username, and theme preferences."
    >
      <SettingsForm />
    </PageShell>
  )
}
