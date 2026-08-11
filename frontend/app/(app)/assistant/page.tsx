import { AssistantChat } from "@/components/assistant/assistant-chat"
import { PageShell } from "@/components/page-shell"

export default function AssistantPage() {
  return (
    <PageShell
      title="Assistant"
      description="Ask for cube recommendations grounded in CubeRank community reviews."
    >
      <AssistantChat />
    </PageShell>
  )
}
