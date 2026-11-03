import "dotenv/config"
import { randomUUID } from "node:crypto"
import assert from "node:assert/strict"
import { db } from "../lib/db"
import { reserveOrder } from "../lib/order-reservation"
import { releaseOrder, checkoutSchema } from "../lib/commerce"
const ids: string[] = []
let productId: string | undefined
let couponId: string | undefined
try {
  const category = await db.category.findFirstOrThrow()
  const product = await db.product.create({
    data: {
      name: "Reservation regression",
      slug: randomUUID(),
      description: "",
      categoryId: category.id,
      price: 10000,
      stock: 1,
    },
  })
  productId = product.id
  const address = {
    postalCode: "1111",
    city: "Budapest",
    street: "Teszt 1",
    country: "HU",
  }
  const input = checkoutSchema.parse({
    email: `reservation-${randomUUID()}@example.com`,
    name: "Teszt Vásárló",
    phone: "0612345678",
    shipping: address,
    billing: address,
    items: [{ productId: product.id, quantity: 1 }],
  })
  let results = await Promise.allSettled([
    reserveOrder(input),
    reserveOrder(input),
  ])
  for (const r of results) if (r.status === "fulfilled") ids.push(r.value.id)
  assert.equal(
    results.filter((r) => r.status === "fulfilled").length,
    1,
    "Only one concurrent reservation for last stock item"
  )
  assert.equal(
    (await db.product.findUniqueOrThrow({ where: { id: product.id } }))
      .reserved,
    1
  )
  await Promise.all([releaseOrder(ids[0]), releaseOrder(ids[0])])
  assert.equal(
    (await db.product.findUniqueOrThrow({ where: { id: product.id } }))
      .reserved,
    0,
    "Release is idempotent"
  )
  await db.product.update({ where: { id: product.id }, data: { stock: 3 } })
  const coupon = await db.coupon.create({
    data: { code: randomUUID().toUpperCase(), amount: 10, limit: 1 },
  })
  couponId = coupon.id
  results = await Promise.allSettled([
    reserveOrder({ ...input, coupon: coupon.code }),
    reserveOrder({ ...input, coupon: coupon.code }),
  ])
  for (const r of results) if (r.status === "fulfilled") ids.push(r.value.id)
  assert.equal(
    results.filter((r) => r.status === "fulfilled").length,
    1,
    "Last coupon use cannot be reserved twice"
  )
  assert.equal(
    (await db.coupon.findUniqueOrThrow({ where: { id: coupon.id } })).reserved,
    1
  )
  for (const id of ids) await releaseOrder(id)
  assert.equal(
    (await db.coupon.findUniqueOrThrow({ where: { id: coupon.id } })).reserved,
    0
  )
  console.log(
    "PASS: concurrent last-item reservation, concurrent coupon limit, idempotent stock/coupon release"
  )
} finally {
  for (const id of ids) await releaseOrder(id)
  await db.orderItem.deleteMany({ where: { orderId: { in: ids } } })
  await db.order.deleteMany({ where: { id: { in: ids } } })
  if (couponId) await db.coupon.delete({ where: { id: couponId } })
  if (productId) await db.product.delete({ where: { id: productId } })
  await db.$disconnect()
}
