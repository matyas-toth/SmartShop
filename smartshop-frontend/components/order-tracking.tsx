"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { OrderSteps } from "@/components/ui/order-steps"
import { orderStatusLabel } from "@/lib/order-status"
const stages = ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"]
const terminal = ["DELIVERED", "CANCELLED", "REFUNDED"]
export function OrderTracking({
  id,
  status,
  token,
}: {
  id: string
  status: string
  token?: string
}) {
  const router = useRouter()
  useEffect(() => {
    if (terminal.includes(status)) return
    let busy = false
    const controller = new AbortController()
    const poll = async () => {
      if (busy || document.visibilityState !== "visible") return
      busy = true
      try {
        const query = token ? "?" + new URLSearchParams({ token }) : ""
        const response = await fetch(
          `/api/orders/${encodeURIComponent(id)}/status${query}`,
          { cache: "no-store", signal: controller.signal }
        )
        if (response.ok && (await response.json()).status !== status)
          router.refresh()
      } catch {
        /* A temporary network error must not hide the last known state. */
      } finally {
        busy = false
      }
    }
    const timer = setInterval(() => void poll(), 3000)
    window.addEventListener("focus", poll)
    document.addEventListener("visibilitychange", poll)
    return () => {
      clearInterval(timer)
      controller.abort()
      window.removeEventListener("focus", poll)
      document.removeEventListener("visibilitychange", poll)
    }
  }, [id, status, token, router])
  const stopped = status === "CANCELLED" || status === "REFUNDED"
  return (
    <Card>
      <CardHeader>
        <CardTitle>Rendeléskövetés</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {stopped ? (
          <Badge variant="outline">{orderStatusLabel[status]}</Badge>
        ) : (
          <>
            {status === "PENDING" ? (
              <Badge variant="outline">Fizetésre vár</Badge>
            ) : null}
            <OrderSteps status={status} />
            <Progress
              aria-label="Rendelés teljesítése"
              aria-valuetext={orderStatusLabel[status]}
              value={(Math.max(0, stages.indexOf(status)) / 3) * 100}
            />
          </>
        )}
      </CardContent>
    </Card>
  )
}
