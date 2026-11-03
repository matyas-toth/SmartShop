import { z } from "zod"
import { db } from "@/lib/db"
import type { Prisma } from "@/generated/prisma/client"
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/shipping"

export const addressSchema = z.object({
  postalCode: z.string().regex(/^\d{4}$/),
  city: z.string().min(1).max(100),
  street: z.string().min(3).max(200),
  country: z.literal("HU").default("HU"),
})
export const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().min(1).max(99),
      })
    )
    .min(1)
    .max(100),
  email: z.email(),
  name: z.string().min(3).max(150),
  phone: z.string().min(6).max(30),
  shipping: addressSchema,
  billing: addressSchema,
  note: z.string().max(1000).default(""),
  coupon: z.string().max(50).optional(),
})
type Tx = Prisma.TransactionClient
export async function quote(tx: Tx, input: z.infer<typeof checkoutSchema>) {
  const quantities = new Map<string, number>()
  for (const item of input.items)
    quantities.set(
      item.productId,
      (quantities.get(item.productId) ?? 0) + item.quantity
    )
  const products = await tx.product.findMany({
    where: { id: { in: [...quantities.keys()] }, active: true },
  })
  if (products.length !== quantities.size)
    throw new Error("Egy termék már nem elérhető.")
  const items = products.map((p) => ({
    productId: p.id,
    name: p.name,
    price: p.price,
    quantity: quantities.get(p.id)!,
  }))
  for (const p of products)
    if (p.stock - p.reserved < quantities.get(p.id)!)
      throw new Error(`Nincs elegendő készlet: ${p.name}`)
  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )
  if (!Number.isSafeInteger(subtotal) || subtotal > 100000000)
    throw new Error("A rendelés értéke meghaladja a megengedett maximumot.")
  let discount = 0
  const coupon = input.coupon
    ? await tx.coupon.findUnique({
        where: { code: input.coupon.trim().toUpperCase() },
      })
    : null
  if (input.coupon) {
    const now = new Date()
    if (
      !coupon ||
      !coupon.active ||
      coupon.startsAt > now ||
      (coupon.expiresAt && coupon.expiresAt <= now) ||
      coupon.used + coupon.reserved >= coupon.limit ||
      subtotal < coupon.minimum
    )
      throw new Error("A kupon erre a kosárra nem érvényes.")
    const eligible = products
      .filter(
        (p) =>
          (!coupon.productIds.length && !coupon.categoryIds.length) ||
          coupon.productIds.includes(p.id) ||
          coupon.categoryIds.includes(p.categoryId)
      )
      .reduce((sum, p) => sum + p.price * quantities.get(p.id)!, 0)
    if (!eligible) throw new Error("A kupon egyik termékre sem használható.")
    discount = Math.min(
      eligible,
      coupon.percent
        ? Math.floor((eligible * coupon.amount) / 100)
        : coupon.amount
    )
  }
  const shippingFee =
    subtotal - discount >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE
  return {
    items,
    subtotal,
    discount,
    shippingFee,
    total: Math.max(0, subtotal - discount + shippingFee),
    couponId: coupon?.id,
  }
}
export async function releaseOrder(id: string) {
  await db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id },
      include: { items: true },
    })
    if (!order) return
    const changed = await tx.order.updateMany({
      where: { id, status: "PENDING" },
      data: { status: "CANCELLED" },
    })
    if (!changed.count) return
    for (const item of order.items)
      await tx.product.update({
        where: { id: item.productId },
        data: { reserved: { decrement: item.quantity } },
      })
    if (order.couponId)
      await tx.coupon.update({
        where: { id: order.couponId },
        data: { reserved: { decrement: 1 } },
      })
  })
}
