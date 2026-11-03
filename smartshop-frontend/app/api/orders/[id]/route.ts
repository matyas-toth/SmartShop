import { db } from "@/lib/db"
import { currentUser, checkOrigin } from "@/lib/server-access"
import { stripe } from "@/lib/payments"
import { releaseOrder } from "@/lib/commerce"
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    checkOrigin(request)
    const { id } = await params
    const { token, action } = await request.json()
    const user = await currentUser()
    const order = await db.order.findUniqueOrThrow({
      where: { id },
      include: { items: true },
    })
    if (!(
      token === order.accessToken ||
      (user && (order.userId === user.id || user.role === "ADMIN"))
    ))
      throw new Error("Nincs jogosultság.")
    if (order.status === "PENDING") {
      if (action === "pay") {
        if (!order.sessionId) throw new Error("A fizetés még nem indítható.")
        const session = await stripe().checkout.sessions.retrieve(
          order.sessionId
        )
        if (session.status !== "open" || !session.url)
          throw new Error(
            "A fizetési hivatkozás lejárt. Indíts új rendelést a kosaradból."
          )
        return Response.json({ url: session.url })
      }
      if (order.sessionId) {
        const session = await stripe().checkout.sessions.retrieve(
          order.sessionId
        )
        if (session.status === "complete")
          throw new Error("A fizetés feldolgozás alatt van.")
        if (session.status === "open")
          await stripe().checkout.sessions.expire(order.sessionId)
      }
      await releaseOrder(id)
    } else {
      if (!order.paymentIntent) throw new Error("Hiányzó fizetési azonosító.")
      await db.$transaction(
        async (tx) => {
          const changed = await tx.order.updateMany({
            where: { id, status: { in: ["PAID", "PROCESSING"] } },
            data: { status: "REFUNDED" },
          })
          if (!changed.count) throw new Error("A rendelés nem mondható le.")
          await stripe().refunds.create(
            { payment_intent: order.paymentIntent! },
            { idempotencyKey: `refund-${id}` }
          )
          for (const item of order.items)
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            })
        },
        { timeout: 20000 }
      )
    }
    return Response.json({ ok: true })
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Sikertelen művelet." },
      { status: 400 }
    )
  }
}
