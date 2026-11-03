import { db } from "@/lib/db"
import { quote, checkoutSchema } from "@/lib/commerce"
import type { z } from "zod"
export async function reserveOrder(
  input: z.infer<typeof checkoutSchema>,
  userId?: string,
  cartId?: string,
  expectedTotal?: number
) {
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(928173)::text`
    const totals = await quote(tx, input)
    if (expectedTotal !== undefined && expectedTotal !== totals.total)
      throw new Error("A kosár ára megváltozott. Ellenőrizd újra a rendelést.")
    for (const item of totals.items)
      await tx.product.update({
        where: { id: item.productId },
        data: { reserved: { increment: item.quantity } },
      })
    if (totals.couponId)
      await tx.coupon.update({
        where: { id: totals.couponId },
        data: { reserved: { increment: 1 } },
      })
    const { items, ...amounts } = totals
    return tx.order.create({
      data: {
        ...amounts,
        userId,
        cartId,
        email: input.email,
        name: input.name,
        phone: input.phone,
        shipping: input.shipping,
        billing: input.billing,
        note: input.note,
        expiresAt: new Date(Date.now() + 35 * 60000),
        items: { create: items },
      },
    })
  })
}
