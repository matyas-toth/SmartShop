import "dotenv/config"
import assert from "node:assert/strict"
import { db } from "../lib/db"
import { checkoutSchema, quote } from "../lib/commerce"
const marker = new Error("ROLLBACK_TEST")
try {
  await db.$transaction(async (tx) => {
    const category = await tx.category.create({
      data: { name: "Test", slug: crypto.randomUUID() },
    })
    const product = await tx.product.create({
      data: {
        name: "Test",
        slug: crypto.randomUUID(),
        description: "",
        categoryId: category.id,
        price: 10000,
        stock: 2,
      },
    })
    const input = checkoutSchema.parse({
      name: "Test User",
      email: "test@example.com",
      phone: "0612345678",
      shipping: { postalCode: "1111", city: "Budapest", street: "Teszt 1" },
      billing: { postalCode: "1111", city: "Budapest", street: "Teszt 1" },
      items: [{ productId: product.id, quantity: 1 }],
    })
    assert.equal((await quote(tx, input)).total, 11490)
    const coupon = await tx.coupon.create({
      data: {
        code: crypto.randomUUID().toUpperCase(),
        amount: 50000,
        percent: false,
        productIds: [product.id],
      },
    })
    const discounted = await quote(tx, { ...input, coupon: coupon.code })
    assert.equal(discounted.discount, 10000)
    assert.equal(discounted.total, 1490)
    await assert.rejects(() =>
      quote(tx, { ...input, items: [{ productId: product.id, quantity: 3 }] })
    )
    await assert.rejects(() => quote(tx, { ...input, coupon: "INVALID" }))
    await tx.coupon.update({
      where: { id: coupon.id },
      data: { categoryIds: ["nonexistent"], productIds: [] },
    })
    await assert.rejects(() => quote(tx, { ...input, coupon: coupon.code }))
    throw marker
  })
} catch (e) {
  if (e !== marker) throw e
}
await assert.rejects(() =>
  db.product.updateMany({
    where: { id: "wave-headphones" },
    data: { stock: -1 },
  })
)
console.log(
  "PASS: totals, discount cap, coupon eligibility, insufficient stock, database constraint"
)
await db.$disconnect()
