import { createHash } from "node:crypto"
import { db } from "@/lib/db"
import { checkOrigin, requireManager } from "@/lib/server-access"
import {
  ImageInputError,
  MAX_IMAGE_BYTES,
  prepareProductImage,
  readImageBody,
} from "@/lib/product-images"

export const runtime = "nodejs"
type Context = { params: Promise<{ id: string }> }
export async function GET(request: Request, { params }: Context) {
  const { id } = await params
  const image = await db.productImage.findFirst({
    where: { productId: id, product: { active: true } },
  })
  if (!image)
    return new Response(null, {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    })
  const headers = {
    "Content-Type": image.contentType,
    "Content-Length": String(image.data.byteLength),
    "Cache-Control": "public, max-age=0, must-revalidate",
    "X-Content-Type-Options": "nosniff",
    "Content-Disposition": 'inline; filename="product.webp"',
    ETag: `"${image.hash}"`,
  }
  if (
    request.headers
      .get("if-none-match")
      ?.split(",")
      .map((v) => v.trim().replace(/^W\//, ""))
      .includes(headers.ETag)
  ) {
    return new Response(null, {
      status: 304,
      headers: {
        ETag: headers.ETag,
        "Cache-Control": headers["Cache-Control"],
      },
    })
  }
  return new Response(new Uint8Array(image.data), { headers })
}

export async function PUT(request: Request, { params }: Context) {
  try {
    checkOrigin(request)
    await requireManager()
  } catch {
    return Response.json({ error: "Nincs jogosultság." }, { status: 403 })
  }
  const { id } = await params
  if (
    !(await db.product.findFirst({
      where: { id, active: true },
      select: { id: true },
    }))
  ) {
    return Response.json({ error: "A termék nem található." }, { status: 404 })
  }
  if (Number(request.headers.get("content-length")) > MAX_IMAGE_BYTES) {
    return Response.json(
      { error: "A kép legfeljebb 5 MB lehet." },
      { status: 413 }
    )
  }
  try {
    const data = await prepareProductImage(await readImageBody(request))
    const hash = createHash("sha256").update(data).digest("hex")
    const values = {
      data: new Uint8Array(data),
      hash,
      contentType: "image/webp",
    }
    await db.productImage.upsert({
      where: { productId: id },
      create: { productId: id, ...values },
      update: values,
    })
    return Response.json({ image: `/api/products/${id}/image?v=${hash}` })
  } catch (error) {
    if (error instanceof ImageInputError)
      return Response.json({ error: error.message }, { status: 400 })
    console.error("Product image upload failed", error)
    return Response.json(
      { error: "A kép mentése nem sikerült." },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: Context) {
  try {
    checkOrigin(request)
    await requireManager()
  } catch {
    return Response.json({ error: "Nincs jogosultság." }, { status: 403 })
  }
  const { id } = await params
  await db.productImage.deleteMany({ where: { productId: id } })
  return new Response(null, { status: 204 })
}
