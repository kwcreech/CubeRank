"use client"

import Link from "next/link"
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react"
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
  const promptRef = useRef<HTMLTextAreaElement>(null)
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

  useEffect(() => {
    const el = promptRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [prompt])

  function handlePromptKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
      return
    }
    event.preventDefault()
    if (canSend) {
      void sendPrompt(prompt)
    }
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
                className="rounded-control border border-input bg-card px-3.5 py-2 text-left text-sm text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
                onClick={() => {
                  setPrompt(sample)
                  promptRef.current?.focus()
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
                    className="rounded-full border border-input bg-muted/40 px-2 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
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

      <form onSubmit={handleSubmit}>
        <div
          className={cn(
            "rounded-[16px] border bg-card shadow-sm transition-colors",
            overLimit
              ? "border-destructive"
              : "border-input focus-within:border-ring"
          )}
        >
          <div className="p-4 pb-0">
            <Textarea
              ref={promptRef}
              rows={1}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={handlePromptKeyDown}
              placeholder={
                session
                  ? "Ask about cubes, feel, magnets, beginners…"
                  : "Log in to ask the assistant about cubes"
              }
              maxLength={MAX_PROMPT_CHARS}
              disabled={authLoading || sending || !session}
              aria-invalid={overLimit}
              className="field-sizing-fixed block min-h-[44px] max-h-[160px] w-full resize-none overflow-y-auto rounded-none border-none bg-transparent p-0 leading-6 shadow-none outline-none ring-0 hover:border-transparent focus:border-none focus:outline-none focus:ring-0 focus-visible:border-none focus-visible:ring-0 disabled:bg-transparent dark:bg-transparent dark:hover:bg-transparent dark:disabled:bg-transparent"
            />
          </div>
          <div className="flex items-center justify-between pt-2 px-3 pb-3">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className={cn(
                  "text-xs tabular-nums text-muted-foreground",
                  overLimit && "text-destructive"
                )}
              >
                {prompt.length}/{MAX_PROMPT_CHARS}
              </span>
              {cooldownSeconds != null && cooldownSeconds > 0 ? (
                <span className="truncate text-xs text-muted-foreground">
                  Cooldown: try again in {formatRetry(cooldownSeconds)}
                </span>
              ) : null}
            </div>
            {!authLoading && !session ? (
              <Link
                href="/auth?tab=login&next=/assistant"
                className={cn(buttonVariants({ size: "sm" }), "h-8 shrink-0 px-4")}
              >
                Log in to ask
              </Link>
            ) : (
              <Button
                type="submit"
                size="sm"
                className="h-8 shrink-0 px-4"
                disabled={!canSend}
              >
                {sending ? "Sending…" : "Send"}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
