import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type AuthErrorPageProps = {
  searchParams: Promise<{ message?: string }>
}

export default async function AuthErrorPage({ searchParams }: AuthErrorPageProps) {
  const { message } = await searchParams

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Auth error</CardTitle>
          <CardDescription>
            {message ?? "Something went wrong with the authentication link."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Link
            href="/auth/forgot-password"
            className={buttonVariants({ className: "w-full" })}
          >
            Try forgot password again
          </Link>
          <Link
            href="/auth?tab=login"
            className={buttonVariants({ variant: "outline", className: "w-full" })}
          >
            Back to log in
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
