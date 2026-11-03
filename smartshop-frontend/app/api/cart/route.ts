import { db } from "@/lib/db"
import { serverCart, cartItems } from "@/lib/server-cart"
import { checkOrigin } from "@/lib/server-access"
import { z } from "zod"
export async function GET() {
  const cart = await serverCart()
  return Response.json(await cartItems(cart.id), {
    headers: { "Cache-Control": "no-store" },
  })
}
export async function POST(request: Request) {
  try {
    checkOrigin(request)
    const input = z
      .object({
        productId: z.string(),
        quantity: z.number().int().min(0).max(99),
      })
      .parse(await request.json())
    const cart = await serverCart()
    await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(928174)::text`
      const where = {
        cartId_productId: { cartId: cart.id, productId: input.productId },
      }
      if (!input.quantity) {
        await tx.cartItem.deleteMany({
          where: { cartId: cart.id, productId: input.productId },
        })
        return
      }
      const product = await tx.product.findUnique({
        where: { id: input.productId },
      })
      if (!product?.active || product.stock - product.reserved < input.quantity)
        throw new Error("Nincs elegendő készlet.")
      await tx.cartItem.upsert({
        where,
        create: { cartId: cart.id, ...input },
        update: { quantity: input.quantity },
      })
    })
    return Response.json(await cartItems(cart.id))
  } catch (e) {
    return Response.json(
      {
        error:
          e instanceof z.ZodError
            ? "Érvénytelen mennyiség."
            : e instanceof Error
              ? e.message
              : "A kosár nem menthető.",
      },
      { status: 400 }
    )
  }
}
