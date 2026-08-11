"use client"

import Link from "next/link"
import { useState, type FormEvent } from "react"
import { toast } from "sonner"

import { useAuth } from "@/components/providers/auth-provider"
import { Button, buttonVariants } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { queryAssistant } from "@/lib/api/client"
import { ApiError, type AssistantCitation } from "@/lib/types/api"
import { cn } from "@/lib/utils"

const MAX_PROMPT_CHARS = 500

const SAMPLE_PROMPTS = [
  "What's a good budget 3x3 for beginners?",
  "Which cubes feel the most stable for OH?",
  "Recommend something smooth with strong magnets.",
] as const

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
  citations?: AssistantCitation[]
}

function formatRetry(seconds: number) {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.ceil(seconds / 60)
  return `${minutes} min`
}

export function AssistantChat() {
  const { session, loading: authLoading } = useAuth()
  const [prompt, setPrompt] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sending, setSending] = useState(false)
  const [remainingQuota, setRemainingQuota] = useState<number | null>(null)
  const [cooldownSeconds, setCooldownSeconds] = useState<number | null>(null)

  const trimmed = prompt.trim()
  const overLimit = prompt.length > MAX_PROMPT_CHARS
  const canSend =
    !!session &&
    !authLoading &&
    !sending &&
    trimmed.length > 0 &&
    !overLimit &&
    (cooldownSeconds == null || cooldownSeconds <= 0)

  async function sendPrompt(text: string) {
    if (!session?.access_token) {
      return
    }
    const value = text.trim()
    if (!value || value.length > MAX_PROMPT_CHARS || sending) {
      return
    }

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: value,
    }
    setMessages((prev) => [...prev, userMessage])
    setPrompt("")
    setSending(true)

    try {
      const result = await queryAssistant(session.access_token, value)
      setRemainingQuota(result.remainingQuota)
      setCooldownSeconds(null)
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: result.answer,
          citations: result.citations,
        },
      ])
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        const retry = err.retryAfterSeconds ?? 3600
        setCooldownSeconds(retry)
        toast.error(`Rate limit reached. Try again in ${formatRetry(retry)}.`)
      } else if (err instanceof ApiError && err.status === 401) {
        toast.error("Please log in to ask the assistant.")
      } else {
        toast.error(err instanceof ApiError ? err.message : "Failed to get a response")
      }
      setMessages((prev) => [
        ...prev,
        {
          id: `a-err-${Date.now()}`,
          role: "assistant",
          content:
            err instanceof ApiError
              ? err.message
              : "Something went wrong talking to the assistant.",
        },
      ])
    } finally {
      setSending(false)
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    void sendPrompt(prompt)
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <div className="rounded-xl border border-border/80 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        Answers are grounded in CubeRank community reviews. Authenticated users get{" "}
        <span className="font-medium text-foreground">3 prompts per hour</span>
        {remainingQuota != null ? (
          <>
            {" "}
            · <span className="font-medium text-foreground">{remainingQuota} left</span> this hour
          </>
        ) : null}
        .
      </div>

      {messages.length === 0 ? (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Try asking</p>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {SAMPLE_PROMPTS.map((sample) => (
              <button
                key={sample}
                type="button"
                className="rounded-lg border border-border bg-background px-3 py-2 text-left text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                onClick={() => {
                  setPrompt(sample)
                }}
              >
                {sample}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex min-h-[240px] flex-col gap-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "max-w-[95%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
              message.role === "user"
                ? "ml-auto bg-foreground text-background"
                : "mr-auto border border-border/80 bg-background text-foreground"
            )}
          >
            <p className="whitespace-pre-wrap">{message.content}</p>
            {message.citations && message.citations.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2 border-t border-border/60 pt-3">
                {message.citations.map((citation) => (
                  <Link
                    key={`${message.id}-${citation.reviewId}`}
                    href={`/cubes/${citation.cubeId}`}
                    className="rounded-md border border-border/80 bg-muted/40 px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
                    title={citation.excerpt}
                  >
                    {citation.cubeName}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        ))}
        {sending ? (
          <p className="text-sm text-muted-foreground">Thinking…</p>
        ) : null}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-y-2">
          <Textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder={
              session
                ? "Ask about cubes, feel, magnets, beginners…"
                : "Log in to ask the assistant about cubes"
            }
            rows={3}
            maxLength={MAX_PROMPT_CHARS}
            disabled={authLoading || sending || !session}
            aria-invalid={overLimit}
          />
          <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
            <span>
              {prompt.length}/{MAX_PROMPT_CHARS}
              {overLimit ? " — too long" : ""}
            </span>
            {cooldownSeconds != null && cooldownSeconds > 0 ? (
              <span>Cooldown: try again in {formatRetry(cooldownSeconds)}</span>
            ) : null}
          </div>
        </div>

        {!authLoading && !session ? (
          <Link
            href="/auth?tab=login&next=/assistant"
            className={cn(buttonVariants({ size: "lg" }), "inline-flex")}
          >
            Log in to ask
          </Link>
        ) : (
          <Button type="submit" size="lg" disabled={!canSend}>
            {sending ? "Sending…" : "Send"}
          </Button>
        )}
      </form>
    </div>
  )
}
