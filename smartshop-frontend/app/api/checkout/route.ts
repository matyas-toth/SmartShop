import { checkoutSchema, releaseOrder } from "@/lib/commerce"
import { z } from "zod"
import { currentUser, checkOrigin } from "@/lib/server-access"
import { db } from "@/lib/db"
import { stripe } from "@/lib/payments"
import { serverCart, cartItems } from "@/lib/server-cart"
import { reserveOrder } from "@/lib/order-reservation"

export async function POST(request: Request) {
  let orderId: string | undefined
  let checkoutSessionId: string | undefined
  try {
    checkOrigin(request)
    const cart = await serverCart()
    const body = await request.json()
    const expectedTotal =
      body.expectedTotal === undefined
        ? undefined
        : z.number().int().nonnegative().parse(body.expectedTotal)
    const input = checkoutSchema.parse({
      ...body,
      items: await cartItems(cart.id),
    })
    const user = await currentUser()
    const client = stripe()
    const order = await reserveOrder(input, user?.id, cart.id, expectedTotal)
    orderId = order.id
    const session = await client.checkout.sessions.create(
      {
        mode: "payment",
        customer_email: order.email,
        expires_at: Math.floor(Date.now() / 1000) + 1800,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "huf",
              unit_amount: order.total * 100,
              product_data: { name: `SmartShop #${order.number}` },
            },
          },
        ],
        metadata: { orderId: order.id },
        success_url: `${process.env.BETTER_AUTH_URL}/orders/${order.id}?token=${order.accessToken}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.BETTER_AUTH_URL}/orders/${order.id}?token=${order.accessToken}`,
      },
      { idempotencyKey: order.id }
    )
    checkoutSessionId = session.id
    await db.order.update({
      where: { id: order.id },
      data: { sessionId: session.id },
    })
    return Response.json({ url: session.url })
  } catch (error) {
    if (orderId) {
      if (!checkoutSessionId) await releaseOrder(orderId)
      else {
        try {
          await stripe().checkout.sessions.expire(checkoutSessionId)
          await releaseOrder(orderId)
        } catch {
          await db.order
            .update({
              where: { id: orderId },
              data: { sessionId: checkoutSessionId },
            })
            .catch(() => {})
        }
      }
    }
    return Response.json(
      {
        error:
          error instanceof z.ZodError
            ? "Ellenőrizd a rendelési adatokat."
            : error instanceof Error
              ? error.message
              : "A rendelés nem sikerült.",
      },
      { status: 400 }
    )
  }
}
