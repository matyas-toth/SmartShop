"use client"
import { useState } from "react"
import Link from "next/link"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { refreshCart } from "@/lib/cart-store"
export function AccountForm({
  next = "/account",
  oauthError,
}: {
  next?: string
  oauthError?: string
}) {
  const router = useRouter()
  const [register, setRegister] = useState(false)
  const [error, setError] = useState(
    oauthError
      ? "A Google-belépés nem sikerült. Próbáld újra, vagy lépj be az e-mail-címeddel."
      : ""
  )
  const [pending, setPending] = useState(false)
  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>{register ? "Regisztráció" : "Bejelentkezés"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault()
            setPending(true)
            setError("")
            const data = new FormData(e.currentTarget)
            try {
              const input = {
                email: String(data.get("email")),
                password: String(data.get("password")),
                name: String(data.get("name")),
              }
              const result = register
                ? await authClient.signUp.email(input)
                : await authClient.signIn.email(input)
              if (result.error)
                setError(result.error.message ?? "Sikertelen bejelentkezés.")
              else {
                await refreshCart()
                router.push(next)
                router.refresh()
              }
            } catch {
              setError("A bejelentkezés nem sikerült.")
            } finally {
              setPending(false)
            }
          }}
        >
          <FieldGroup>
            {register ? (
              <Field>
                <FieldLabel htmlFor="name">Név</FieldLabel>
                <Input id="name" name="name" required autoComplete="name" />
              </Field>
            ) : null}
            <Field>
              <FieldLabel htmlFor="email">E-mail</FieldLabel>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="password">Jelszó</FieldLabel>
              <Input
                id="password"
                name="password"
                type="password"
                minLength={12}
                required
                autoComplete={register ? "new-password" : "current-password"}
              />
            </Field>
          </FieldGroup>
          {error ? (
            <Alert variant="destructive">
              <AlertTitle>{error}</AlertTitle>
            </Alert>
          ) : null}
          <Button type="submit" disabled={pending}>
            {register ? "Fiók létrehozása" : "Belépés"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={async () => {
              setPending(true)
              setError("")
              try {
                const result = await authClient.signIn.social({
                  provider: "google",
                  callbackURL: next,
                  errorCallbackURL: "/login",
                })
                if (result.error)
                  setError(
                    result.error.message ?? "A Google-belépés nem indítható."
                  )
              } catch {
                setError("A Google-belépés nem indítható.")
              } finally {
                setPending(false)
              }
            }}
          >
            Belépés Google-fiókkal
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setRegister(!register)}
          >
            {register ? "Már van fiókom" : "Regisztrálok"}
          </Button>
          <Link href="/reset-password">Elfelejtett jelszó</Link>
        </form>
      </CardContent>
    </Card>
  )
}
