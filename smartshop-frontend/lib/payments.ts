import Stripe from "stripe"
import { db } from "@/lib/db"
import { Resend } from "resend"

export function stripe() {
  if (!process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_"))
    throw new Error("Stripe tesztkulcs nincs beállítva.")
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}
export async function fulfill(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid" || !session.metadata?.orderId) return
  const id = session.metadata.orderId
  await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(928174)::text`
    const order = await tx.order.findUnique({
      where: { id },
      include: { items: true },
    })
    if (
      !order ||
      order.sessionId !== session.id ||
      session.currency !== "huf" ||
      session.amount_total !== order.total * 100
    )
      throw new Error("Eltérő fizetési adatok.")
    const changed = await tx.order.updateMany({
      where: { id, status: "PENDING" },
      data: {
        status: "PAID",
        paymentIntent:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id,
      },
    })
    if (!changed.count) return
    for (const item of order.items)
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stock: { decrement: item.quantity },
          reserved: { decrement: item.quantity },
        },
      })
    if (order.cartId) {
      for (const item of order.items) {
        await tx.cartItem.deleteMany({
          where: {
            cartId: order.cartId,
            productId: item.productId,
            quantity: { lte: item.quantity },
          },
        })
        await tx.cartItem.updateMany({
          where: {
            cartId: order.cartId,
            productId: item.productId,
            quantity: { gt: item.quantity },
          },
          data: { quantity: { decrement: item.quantity } },
        })
      }
    }
    if (order.couponId)
      await tx.coupon.update({
        where: { id: order.couponId },
        data: { used: { increment: 1 }, reserved: { decrement: 1 } },
      })
  })
  await sendConfirmation(id)
}
export async function sendConfirmation(id: string) {
  const order = await db.order.findUnique({
    where: { id },
    include: { items: true },
  })
  if (
    !order ||
    order.status === "PENDING" ||
    order.status === "CANCELLED" ||
    order.emailSentAt
  )
    return
  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM)
    throw new Error("Resend nincs beállítva.")
  const result = await new Resend(process.env.RESEND_API_KEY).emails.send(
    {
      from: process.env.EMAIL_FROM,
      to: order.email,
      subject: `SmartShop rendelés #${order.number}`,
      text: `Kedves ${order.name}!\n\nRendelésed fizetése sikeres.\n${order.items.map((i) => `${i.name}: ${i.quantity} db, ${i.price} Ft/db`).join("\n")}\nÖsszesen: ${order.total} Ft\n\n${process.env.BETTER_AUTH_URL}/orders/${id}?token=${order.accessToken}`,
    },
    { idempotencyKey: `order-confirmation-${id}` }
  )
  if (result.error) throw new Error(result.error.message)
  await db.order.update({ where: { id }, data: { emailSentAt: new Date() } })
}
