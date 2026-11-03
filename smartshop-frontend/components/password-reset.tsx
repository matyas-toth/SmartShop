"use client"
import { useState } from "react"
import { authClient } from "@/lib/auth-client"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
export function PasswordReset({ token }: { token?: string }) {
  const [message, setMessage] = useState("")
  const [pending, setPending] = useState(false)
  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Jelszó módosítása</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault()
            setPending(true)
            const f = new FormData(e.currentTarget)
            try {
              const result = token
                ? await authClient.resetPassword({
                    token,
                    newPassword: String(f.get("password")),
                  })
                : await authClient.requestPasswordReset({
                    email: String(f.get("email")),
                    redirectTo: "/reset-password",
                  })
              setMessage(
                result.error
                  ? (result.error.message ?? "Sikertelen jelszócsere.")
                  : token
                    ? "A jelszó megváltozott."
                    : "Ha a fiók létezik, elküldtük a jelszócseréhez szükséges hivatkozást."
              )
            } catch {
              setMessage("A kérés nem sikerült.")
            } finally {
              setPending(false)
            }
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="reset">
                {token ? "Új jelszó" : "E-mail"}
              </FieldLabel>
              <Input
                id="reset"
                name={token ? "password" : "email"}
                type={token ? "password" : "email"}
                minLength={token ? 12 : undefined}
                required
              />
            </Field>
          </FieldGroup>
          <Button type="submit" disabled={pending}>
            {token ? "Jelszó mentése" : "Hivatkozás küldése"}
          </Button>
          {message}
        </form>
      </CardContent>
    </Card>
  )
}
