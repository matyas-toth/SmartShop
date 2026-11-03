import "dotenv/config"
import { db } from "../lib/db"
import { releaseOrder } from "../lib/commerce"
import { stripe, fulfill, sendConfirmation } from "../lib/payments"
const orders = await db.order.findMany({
  where: { status: "PENDING", expiresAt: { lt: new Date() } },
})
for (const order of orders) {
  try {
    if (order.sessionId) {
      const session = await stripe().checkout.sessions.retrieve(order.sessionId)
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
await db.$disconnect()
