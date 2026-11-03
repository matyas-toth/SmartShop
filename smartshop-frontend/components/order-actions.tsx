"use client"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { refreshCart } from "@/lib/cart-store"
export function OrderActions({
  id,
  token,
  status,
  canCancel = true,
}: {
  id: string
  token?: string
  status: string
  canCancel?: boolean
}) {
  const [message, setMessage] = useState("")
  const [pending, setPending] = useState(false)
  useEffect(() => {
    void refreshCart().catch(() => {})
  }, [status])
  return (
    <div className="flex flex-col gap-3">
      {canCancel && status === "PENDING" ? (
        <Button
          disabled={pending}
          onClick={async () => {
            setPending(true)
            try {
              const response = await fetch(`/api/orders/${id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, action: "pay" }),
              })
              const result = await response.json()
              if (!response.ok) throw new Error(result.error)
              window.location.assign(result.url)
            } catch (e) {
              setMessage(
                e instanceof Error ? e.message : "A fizetés nem indítható."
              )
              setPending(false)
            }
          }}
        >
          Fizetés folytatása
        </Button>
      ) : null}
      {canCancel && ["PENDING", "PAID", "PROCESSING"].includes(status) ? (
        <Button
          disabled={pending}
          variant="outline"
          onClick={async () => {
            setPending(true)
            try {
              const response = await fetch(`/api/orders/${id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token }),
              })
              const result = await response.json()
              if (response.ok) window.location.reload()
              else setMessage(result.error)
            } catch {
              setMessage("A lemondás nem sikerült.")
            } finally {
              setPending(false)
            }
          }}
        >
          Rendelés lemondása
        </Button>
      ) : null}
      {message}
    </div>
  )
}
