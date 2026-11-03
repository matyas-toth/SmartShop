"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { orderStatusLabel } from "@/lib/order-status"
export function AdminOrderPanel({
  id,
  status,
  trackingNumber,
  adminNote,
  emailSentAt,
}: {
  id: string
  status: string
  trackingNumber: string
  adminNote: string
  emailSentAt: string | null
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState("")
  const next: Record<string, string> = {
    PAID: "PROCESSING",
    PROCESSING: "SHIPPED",
    SHIPPED: "DELIVERED",
  }
  async function save(action: string, data: unknown) {
    setPending(true)
    setMessage("")
    try {
      const r = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id, data }),
      })
      const result = await r.json()
      if (!r.ok) throw new Error(result.error)
      setMessage("A változtatásokat mentettük.")
      router.refresh()
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "A mentés nem sikerült.")
    } finally {
      setPending(false)
    }
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rendelés kezelése</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {message ? (
          <Alert>
            <AlertTitle>{message}</AlertTitle>
          </Alert>
        ) : null}
        <form
          key={trackingNumber + ":" + adminNote}
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault()
            const f = new FormData(e.currentTarget)
            void save("order.details", {
              trackingNumber: f.get("trackingNumber"),
              adminNote: f.get("adminNote"),
            })
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="trackingNumber">Csomagazonosító</FieldLabel>
              <Input
                id="trackingNumber"
                name="trackingNumber"
                defaultValue={trackingNumber}
                maxLength={100}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="adminNote">Belső megjegyzés</FieldLabel>
              <Textarea
                id="adminNote"
                name="adminNote"
                defaultValue={adminNote}
                maxLength={3000}
              />
            </Field>
          </FieldGroup>
          <Button type="submit" disabled={pending}>
            Rendelési adatok mentése
          </Button>
        </form>
        {next[status] ? (
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => void save("order.status", { status: next[status] })}
          >
            Állapot: {orderStatusLabel[next[status]]}
          </Button>
        ) : null}
        {["PAID", "PROCESSING", "SHIPPED", "DELIVERED"].includes(status) ? (
          <div>
            {emailSentAt ? (
              `Visszaigazolás elküldve: ${new Date(emailSentAt).toLocaleString("hu-HU")}`
            ) : (
              <Button
                variant="outline"
                disabled={pending}
                onClick={() => void save("order.email", {})}
              >
                Visszaigazolás küldésének újrapróbálása
              </Button>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
