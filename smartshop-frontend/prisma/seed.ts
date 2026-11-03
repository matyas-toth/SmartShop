import "dotenv/config"
import { hashPassword } from "better-auth/crypto"
import { db } from "../lib/db"
import { defaultCatalog } from "../lib/products"
import { randomUUID } from "node:crypto"
import { createHash } from "node:crypto"
import { prepareProductImage } from "../lib/product-images"

for (const category of defaultCatalog.categories) {
  await db.category.upsert({
    where: { id: category.id },
    create: category,
    update: {},
  })
}
for (const product of defaultCatalog.products) {
  await db.product.upsert({
    where: { id: product.id },
    create: product,
    update: {},
  })
}
const extra = [
  {
    id: "orbit-speaker",
    slug: "orbit-bluetooth-hangszoro",
    name: "Orbit Bluetooth hangszóró",
    description: "Kompakt, vezeték nélküli hangszóró otthoni zenehallgatáshoz.",
    categoryId: "audio",
    price: 22990,
    stock: 18,
    icon: "package",
  },
  {
    id: "focus-mouse",
    slug: "focus-vezetek-nelkuli-eger",
    name: "Focus vezeték nélküli egér",
    description: "Pontos követés és kényelmes fogás a mindennapi munkához.",
    categoryId: "office",
    price: 11990,
    stock: 24,
    icon: "package",
  },
  {
    id: "brew-mug",
    slug: "brew-keramia-bogre",
    name: "Brew kerámia bögre",
    description:
      "Letisztult kerámiabögre kávéhoz és teához, 350 ml űrtartalommal.",
    categoryId: "home",
    price: 4990,
    stock: 35,
    icon: "package",
  },
  {
    id: "studio-headphones",
    slug: "studio-monitor-fejhallgato",
    name: "Studio monitor fejhallgató",
    description:
      "Zárt kialakítású fejhallgató részletes hangzással és puha fülpárnákkal.",
    categoryId: "audio",
    price: 29990,
    stock: 14,
    icon: "headphones",
  },
  {
    id: "trail-backpack",
    slug: "trail-utazo-hatizsak",
    name: "Trail utazó hátizsák",
    description:
      "Könnyű, tágas hátizsák hétvégi utazásokhoz és a városi mindennapokhoz.",
    categoryId: "accessories",
    price: 26990,
    stock: 11,
    icon: "backpack",
  },
  {
    id: "frame-camera",
    slug: "frame-digitalis-fenykepezogep",
    name: "Frame digitális fényképezőgép",
    description:
      "Könnyen kezelhető fényképezőgép a fontos pillanatok megörökítéséhez.",
    categoryId: "photo",
    price: 89990,
    stock: 6,
    icon: "camera",
  },
  {
    id: "motion-watch",
    slug: "motion-sportora",
    name: "Motion sportóra",
    description: "Sportos óra aktivitáskövetéssel, mindennapos használatra.",
    categoryId: "wearables",
    price: 32990,
    stock: 12,
    icon: "watch",
  },
  {
    id: "nordic-lamp",
    slug: "nordic-olvasolampa",
    name: "Nordic olvasólámpa",
    description:
      "Kis helyigényű asztali világítás olvasáshoz és esti munkához.",
    categoryId: "home",
    price: 15990,
    stock: 9,
    icon: "lamp",
  },
]
for (const product of extra)
  await db.product.upsert({
    where: { id: product.id },
    create: product,
    update: {},
  })
const photos: Record<string, string> = {
  "wave-headphones": "1505740420928-5e560c06d30e",
  "pulse-watch": "1524805444758-089113d48a6d",
  "halo-lamp": "1507473885765-e6ed057f782c",
  "type-mini-keyboard": "1587829741301-dc798b83add3",
  "roam-backpack": "1553062407-98eeb64c6a62",
  "snap-camera": "1516035069371-29a1b244cc32",
  "orbit-speaker": "1608043152269-423dbba4e7e1",
  "focus-mouse": "1527814050087-3793815479db",
  "brew-mug": "1514228742587-6b1558fcca3d",
  "studio-headphones": "1546435770-a3e426bf472b",
  "trail-backpack": "1622560480605-d83c853bc5c3",
  "frame-camera": "1502920917128-1aa500764cbd",
  "motion-watch": "1434056886845-dac89ffe9b56",
  "nordic-lamp": "1507473885765-e6ed057f782c",
}
for (const [id, photo] of Object.entries(photos)) {
  if (await db.productImage.findUnique({ where: { productId: id } })) continue
  const response = await fetch(
    `https://images.unsplash.com/photo-${photo}?auto=format&fit=crop&w=900&q=85`,
    { signal: AbortSignal.timeout(20000) }
  )
  if (!response.ok) throw new Error(`Nem tölthető be a mintakép: ${id}`)
  const data = await prepareProductImage(
    new Uint8Array(await response.arrayBuffer())
  )
  await db.productImage.create({
    data: {
      productId: id,
      data: new Uint8Array(data),
      contentType: "image/webp",
      hash: createHash("sha256").update(data).digest("hex"),
    },
  })
  console.log("Mintakép betöltve:", id)
}
const email = "matyastoth.mail@gmail.com"
if (process.env.ADMIN_INITIAL_PASSWORD) {
  if (process.env.ADMIN_INITIAL_PASSWORD.length < 12)
    throw new Error("Az adminjelszó legalább 12 karakter.")
  const existing = await db.user.findUnique({ where: { email } })
  if (!existing) {
    const id = randomUUID()
    await db.user.create({
      data: {
        id,
        name: "SmartShop Admin",
        email,
        role: "ADMIN",
        emailVerified: true,
        accounts: {
          create: {
            id: randomUUID(),
            accountId: id,
            providerId: "credential",
            password: await hashPassword(process.env.ADMIN_INITIAL_PASSWORD),
          },
        },
      },
    })
  }
}
await db.$disconnect()
