import { db } from "@/lib/db"
import { requireManager } from "@/lib/server-access"
export async function GET(request: Request) {
  const admin = new URL(request.url).searchParams.get("admin") === "1"
  if (admin) {
    try {
      await requireManager()
    } catch {
      return Response.json({ error: "Nincs jogosultság." }, { status: 403 })
    }
  }
  const [categories, products] = await Promise.all([
    db.category.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    db.product.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
      include: { imageAsset: { select: { hash: true } } },
    }),
  ])
  return Response.json({
    version: 1,
    categories,
    products: products.map(({ imageAsset, ...p }) => ({
      ...p,
      image: imageAsset
        ? `/api/products/${p.id}/image?v=${imageAsset.hash}`
        : null,
      stock: admin ? p.stock : p.stock - p.reserved,
    })),
  })
}
