import { db } from "@/lib/db"
import { currentUser, checkOrigin } from "@/lib/server-access"
import { addressSchema } from "@/lib/commerce"
import { z } from "zod"
export async function GET() {
  const user = await currentUser()
  if (!user) return Response.json({ user: null, addresses: [] })
  const addresses = await db.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { label: "asc" }],
  })
  return Response.json(
    {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
      addresses,
    },
    { headers: { "Cache-Control": "no-store" } }
  )
}
export async function POST(request: Request) {
  try {
    checkOrigin(request)
    const user = await currentUser()
    if (!user)
      return Response.json({ error: "Jelentkezz be." }, { status: 401 })
    const { action, id, data } = await request.json()
    if (action === "profile") {
      const input = z
        .object({
          name: z.string().trim().min(3).max(150),
          phone: z.string().max(30),
        })
        .parse(data)
      await db.user.update({ where: { id: user.id }, data: input })
    } else if (action === "address.save") {
      const input = addressSchema
        .extend({
          label: z.string().trim().min(1).max(80),
          name: z.string().min(3).max(150),
          phone: z.string().min(6).max(30),
          isDefault: z.boolean(),
        })
        .parse(data)
      await db.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(928175)::text`
        if (
          id &&
          !(await tx.address.findFirst({ where: { id, userId: user.id } }))
        )
          throw new Error("A cím nem található.")
        if (input.isDefault)
          await tx.address.updateMany({
            where: { userId: user.id },
            data: { isDefault: false },
          })
        if (id) await tx.address.update({ where: { id }, data: input })
        else await tx.address.create({ data: { ...input, userId: user.id } })
      })
    } else if (action === "address.delete") {
      await db.address.deleteMany({
        where: { id: z.string().parse(id), userId: user.id },
      })
    } else throw new Error("Ismeretlen művelet.")
    return Response.json({ ok: true })
  } catch (e) {
    return Response.json(
      {
        error:
          e instanceof z.ZodError
            ? "Ellenőrizd a megadott adatokat."
            : e instanceof Error
              ? e.message
              : "Sikertelen mentés.",
      },
      { status: 400 }
    )
  }
}
