import { db } from "@/lib/db"
import { requireManager, checkOrigin } from "@/lib/server-access"
import { z } from "zod"
import { slugify } from "@/lib/products"
import { sendConfirmation } from "@/lib/payments"
import type { Prisma } from "@/generated/prisma/client"
const productSchema = z.object({
  name: z.string().min(1).max(150),
  description: z.string().max(5000),
  categoryId: z.string(),
  price: z.number().int().min(0).max(10000000),
  stock: z.number().int().min(0).max(1000000),
})
export async function GET(request: Request) {
  try {
    const user = await requireManager()
    const params = new URL(request.url).searchParams
    const page = Math.max(1, Math.min(100000, Number(params.get("page")) || 1))
    const q = (params.get("q") ?? "").slice(0, 200)
    const status = z
      .enum([
        "PENDING",
        "PAID",
        "PROCESSING",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
        "REFUNDED",
      ])
      .safeParse(params.get("status"))
    const where: Prisma.OrderWhereInput = {
      ...(status.success ? { status: status.data } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
              ...(/^\d+$/.test(q) && Number(q) < 2147483647
                ? [{ number: Number(q) }]
                : []),
            ],
          }
        : {}),
    }
    const [
      orders,
      coupons,
      users,
      orderCount,
      totalOrders,
      pendingOrders,
      revenue,
    ] = await Promise.all([
      db.order.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 20,
        skip: (Math.floor(page) - 1) * 20,
      }),
      db.coupon.findMany(),
      user.role === "ADMIN"
        ? db.user.findMany({
            select: { id: true, email: true, name: true, role: true },
          })
        : [],
      db.order.count({ where }),
      db.order.count(),
      db.order.count({ where: { status: "PENDING" } }),
      db.order.aggregate({
        where: {
          status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] },
        },
        _sum: { total: true },
      }),
    ])
    return Response.json({
      orders,
      coupons,
      users,
      orderCount,
      metrics: { totalOrders, pendingOrders, revenue: revenue._sum.total ?? 0 },
    })
  } catch {
    return Response.json({ error: "Nincs jogosultság." }, { status: 403 })
  }
}
export async function POST(request: Request) {
  try {
    checkOrigin(request)
    const user = await requireManager()
    const { action, id, data } = await request.json()
    if (action === "category.create") {
      const name = z.string().trim().min(1).max(100).parse(data.name)
      await db.category.create({
        data: {
          name,
          slug: slugify(name) + "-" + crypto.randomUUID().slice(0, 6),
        },
      })
    } else if (action === "category.update") {
      await db.category.update({
        where: { id },
        data: { name: z.string().min(1).max(100).parse(data.name) },
      })
    } else if (action === "category.delete") {
      const changed = await db.category.updateMany({
        where: { id, products: { none: { active: true } } },
        data: { active: false },
      })
      if (!changed.count)
        throw new Error(
          "Előbb helyezd át vagy archiváld a kategória termékeit."
        )
    } else if (action === "product.create") {
      const input = productSchema.parse(data)
      await db.product.create({
        data: {
          ...input,
          slug: slugify(input.name) + "-" + crypto.randomUUID().slice(0, 6),
        },
      })
    } else if (action === "product.update") {
      const input = productSchema.parse(data)
      await db.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(928173)::text`
        const product = await tx.product.findUniqueOrThrow({ where: { id } })
        if (input.stock < product.reserved)
          throw new Error("A készlet nem lehet kevesebb a foglaltnál.")
        await tx.product.update({ where: { id }, data: input })
      })
    } else if (action === "product.move") {
      await db.product.update({
        where: { id },
        data: { categoryId: z.string().parse(data.categoryId) },
      })
    } else if (action === "product.delete") {
      await db.product.update({ where: { id }, data: { active: false } })
    } else if (action === "coupon.save") {
      const input = z
        .object({
          code: z
            .string()
            .trim()
            .min(1)
            .max(50)
            .transform((v) => v.toUpperCase()),
          percent: z.boolean(),
          amount: z.number().int().positive(),
          minimum: z.number().int().min(0),
          limit: z.number().int().positive(),
          active: z.boolean(),
          expiresAt: z.string().nullable(),
          startsAt: z.string().optional(),
          productIds: z.array(z.string()),
          categoryIds: z.array(z.string()),
        })
        .parse(data)
      if (input.percent && input.amount > 100)
        throw new Error("Legfeljebb 100% kedvezmény adható.")
      const values = {
        ...input,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        startsAt: input.startsAt ? new Date(input.startsAt) : undefined,
      }
      if (
        (values.expiresAt && !Number.isFinite(values.expiresAt.getTime())) ||
        (values.startsAt && !Number.isFinite(values.startsAt.getTime()))
      )
        throw new Error("Érvénytelen dátum.")
      if (
        values.startsAt &&
        values.expiresAt &&
        values.startsAt >= values.expiresAt
      )
        throw new Error("A lejáratnak a kezdés után kell lennie.")
      await db.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(928173)::text`
        const old = id
          ? await tx.coupon.findUniqueOrThrow({ where: { id } })
          : null
        if (old && input.limit < old.used + old.reserved)
          throw new Error(
            "A limit kisebb lenne a felhasználások és foglalások összegénél."
          )
        if (
          (await tx.product.count({
            where: { id: { in: input.productIds } },
          })) !== new Set(input.productIds).size ||
          (await tx.category.count({
            where: { id: { in: input.categoryIds } },
          })) !== new Set(input.categoryIds).size
        )
          throw new Error("Ismeretlen termék vagy kategória.")
        if (id) await tx.coupon.update({ where: { id }, data: values })
        else await tx.coupon.create({ data: values })
      })
    } else if (action === "user.role" && user.role === "ADMIN") {
      if (id === user.id) throw new Error("Saját jogosultság nem módosítható.")
      await db.user.update({
        where: { id },
        data: {
          role: z.enum(["CUSTOMER", "MANAGER", "ADMIN"]).parse(data.role),
        },
      })
    } else if (action === "order.status") {
      const status = z
        .enum(["PROCESSING", "SHIPPED", "DELIVERED"])
        .parse(data.status)
      const previous = {
        PROCESSING: "PAID",
        SHIPPED: "PROCESSING",
        DELIVERED: "SHIPPED",
      } as const
      const changed = await db.order.updateMany({
        where: { id, status: previous[status] },
        data: { status },
      })
      if (!changed.count) throw new Error("Érvénytelen állapotváltás.")
    } else if (action === "order.details") {
      await db.order.update({
        where: { id },
        data: z
          .object({
            trackingNumber: z.string().max(100),
            adminNote: z.string().max(3000),
          })
          .parse(data),
      })
    } else if (action === "order.email") {
      await sendConfirmation(z.string().parse(id))
    } else throw new Error("Ismeretlen művelet.")
    return Response.json({ ok: true })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Sikertelen művelet." },
      { status: 400 }
    )
  }
}
