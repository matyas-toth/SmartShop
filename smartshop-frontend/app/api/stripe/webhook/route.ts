import { stripe, fulfill } from "@/lib/payments"
import { releaseOrder } from "@/lib/commerce"
import { db } from "@/lib/db"
export async function POST(request: Request) {
  let event
  try {
    event = stripe().webhooks.constructEvent(
      await request.text(),
      request.headers.get("stripe-signature") ?? "",
      process.env.STRIPE_WEBHOOK_SECRET ?? ""
    )
  } catch {
    return new Response("Invalid signature", { status: 400 })
  }
  try {
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    )
      await fulfill(event.data.object)
    if (
      (event.type === "checkout.session.expired" ||
        event.type === "checkout.session.async_payment_failed") &&
      event.data.object.metadata?.orderId
    ) {
      const order = await db.order.findUnique({
        where: { id: event.data.object.metadata.orderId },
      })
      if (order?.sessionId === event.data.object.id)
        await releaseOrder(order.id)
    }
    return Response.json({ received: true })
  } catch {
    return new Response("Retry required", { status: 500 })
  }
}
