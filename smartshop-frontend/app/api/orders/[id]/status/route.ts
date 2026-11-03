import { db } from "@/lib/db"
import { currentUser } from "@/lib/server-access"
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const token = new URL(request.url).searchParams.get("token")
  const user = await currentUser()
  const order = await db.order.findUnique({
    where: { id },
    select: { status: true, updatedAt: true, userId: true, accessToken: true },
  })
  const headers = { "Cache-Control": "private, no-store" }
  if (
    !order ||
    !(
      token === order.accessToken ||
      (user && (order.userId === user.id || user.role !== "CUSTOMER"))
    )
  )
    return Response.json(
      { error: "A rendelés nem található." },
      { status: 404, headers }
    )
  return Response.json(
    { status: order.status, updatedAt: order.updatedAt },
    { headers }
  )
}
