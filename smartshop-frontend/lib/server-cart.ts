import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { currentUser } from "@/lib/server-access"

const COOKIE = "smartshop-cart"
// Called from route handlers so that the guest cookie can be set.
export async function serverCart() {
  const jar = await cookies()
  const guestId = jar.get(COOKIE)?.value
  const user = await currentUser()
  const cart = await db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(928174)::text`
    const guest = guestId
      ? await tx.cart.findFirst({
          where: { id: guestId, userId: null },
          include: { items: true },
        })
      : null
    if (!user) return guest ?? tx.cart.create({ data: {} })
    const owned = await tx.cart.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
    })
    if (guest) {
      for (const item of guest.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        })
        if (!product?.active || product.stock <= product.reserved) continue
        const existing = await tx.cartItem.findUnique({
          where: {
            cartId_productId: { cartId: owned.id, productId: item.productId },
          },
        })
        const quantity = Math.min(
          99,
          product.stock - product.reserved,
          (existing?.quantity ?? 0) + item.quantity
        )
        await tx.cartItem.upsert({
          where: {
            cartId_productId: { cartId: owned.id, productId: item.productId },
          },
          create: { cartId: owned.id, productId: item.productId, quantity },
          update: { quantity },
        })
      }
      await tx.order.updateMany({
        where: { cartId: guest.id },
        data: { cartId: owned.id },
      })
      await tx.cart.delete({ where: { id: guest.id } })
    }
    return owned
  })
  // Never expose an authenticated cart's ID in a guest cookie.
  if (user) jar.delete(COOKIE)
  else if (cart.id !== guestId)
    jar.set(COOKIE, cart.id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    })
  return cart
}
export async function cartItems(cartId: string) {
  return db.cartItem.findMany({
    where: { cartId, product: { active: true } },
    select: { productId: true, quantity: true },
    orderBy: { productId: "asc" },
  })
}
