import { db } from "@/lib/db"
import { releaseOrder } from "@/lib/commerce"
import { stripe, fulfill, sendConfirmation } from "@/lib/payments"
export async function reconcileOrders() {
  const orders = await db.order.findMany({
    where: { status: "PENDING", expiresAt: { lt: new Date() } },
  })
  for (const order of orders) {
    try {
      if (order.sessionId) {
        const session = await stripe().checkout.sessions.retrieve(
          order.sessionId
        )
        if (session.status === "complete") {
          await fulfill(session)
          continue
        }
        if (session.status === "open")
          await stripe().checkout.sessions.expire(session.id)
      }
      await releaseOrder(order.id)
    } catch {
      console.error("Order reconciliation failed:", order.id)
    }
  }
  if (!process.env.RESEND_API_KEY) return
  const emails = await db.order.findMany({
    where: {
      status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] },
      emailSentAt: null,
    },
  })
  for (const order of emails) {
    try {
      await sendConfirmation(order.id)
    } catch {
      console.error("Email delivery failed:", order.id)
    }
  }
}
const background = globalThis as unknown as {
  shopMaintenanceTimer?: ReturnType<typeof setInterval>
  shopMaintenanceBusy?: boolean
}
export function startMaintenance() {
  if (background.shopMaintenanceTimer) return
  background.shopMaintenanceTimer = setInterval(() => {
    if (background.shopMaintenanceBusy) return
    background.shopMaintenanceBusy = true
    void reconcileOrders()
      .catch(() => console.error("Shop maintenance failed"))
      .finally(() => {
        background.shopMaintenanceBusy = false
      })
  }, 60000)
  background.shopMaintenanceTimer.unref()
}
