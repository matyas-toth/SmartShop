import { db } from "@/lib/db"
import { checkoutSchema, quote } from "@/lib/commerce"
import { checkOrigin } from "@/lib/server-access"
import { serverCart, cartItems } from "@/lib/server-cart"
export async function POST(request: Request) {
  try {
    checkOrigin(request)
    const cart = await serverCart()
    const input = checkoutSchema.parse({
      ...(await request.json()),
      items: await cartItems(cart.id),
    })
    return Response.json(await db.$transaction((tx) => quote(tx, input)))
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Érvénytelen kosár." },
      { status: 400 }
    )
  }
}
