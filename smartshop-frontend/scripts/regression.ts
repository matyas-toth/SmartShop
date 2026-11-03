import "dotenv/config"
import { chromium, expect as baseExpect } from "@playwright/test"
import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { db } from "../lib/db"
import { fulfill } from "../lib/payments"
import type Stripe from "stripe"

const base = process.env.BETTER_AUTH_URL ?? "http://localhost:3000"
const expect = baseExpect.configure({ timeout: 15000 })
const tag = randomUUID().slice(0, 8)
const email = `regression-${tag}@example.com`
const password = randomUUID() + randomUUID()
const browser = await chromium.launch({ channel: "msedge", headless: true })
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
})
const page = await context.newPage()
const errors: string[] = []
page.on("pageerror", (e) => errors.push(e.message))
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text())
})
let userId: string | undefined
let couponId: string | undefined
let fixtureProductId: string | undefined
let fixtureOrderId: string | undefined
async function post(path: string, body: unknown) {
  return context.request.post(base + path, {
    headers: { Origin: base },
    data: body,
  })
}
async function saveButton(name: string) {
  const response = page.waitForResponse(
    (r) => r.url().endsWith("/api/account") && r.request().method() === "POST"
  )
  await page.getByRole("button", { name, exact: true }).click()
  assert.equal((await response).status(), 200)
}
async function screenshot(name: string) {
  await page.evaluate(() => window.scrollTo(0, 0))
  await page.waitForFunction(() =>
    Array.from(document.images)
      .filter((img) => {
        const r = img.getBoundingClientRect()
        return r.top < innerHeight && r.bottom > 0
      })
      .every((img) => img.complete && img.naturalWidth > 0)
  )
  await page.screenshot({ path: join(tmpdir(), `smartshop-${name}.png`) })
}
async function noOverflow() {
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    ),
    "Horizontal page overflow"
  )
}
try {
  await page.goto(base)
  await expect(page).toHaveTitle("SmartShop")
  await expect(
    page.getByRole("link", { name: "Brew kerámia bögre", exact: true })
  ).toBeVisible()
  await expect(page.locator("header")).toHaveCount(1)
  await expect(page.locator("footer")).toHaveCount(1)
  assert.equal((await page.locator("img").count()) > 0, true)
  await screenshot("storefront-desktop")
  await page.getByRole("link", { name: "Audio", exact: true }).first().click()
  await expect(page).toHaveURL(/\/category\/audio/)
  await page.getByLabel("Rendezés").selectOption("price-up")
  await page.goto(base + "/product/wave-vezetek-nelkuli-fejhallgato")
  await page
    .getByRole("button", {
      name: "Wave vezeték nélküli fejhallgató kosárba helyezése",
      exact: true,
    })
    .click()
  await expect(
    page.getByRole("button", {
      name: "Wave vezeték nélküli fejhallgató eltávolítása a kosárból",
      exact: true,
    })
  ).toBeVisible()
  await page.reload()
  await expect(
    page.getByRole("button", {
      name: "Wave vezeték nélküli fejhallgató eltávolítása a kosárból",
      exact: true,
    })
  ).toBeVisible()
  assert.equal(
    (await (await context.request.get(base + "/api/cart")).json())[0].quantity,
    1
  )
  await page.goto(base + "/login?next=/checkout")
  await page.getByRole("button", { name: "Regisztrálok", exact: true }).click()
  await page.getByLabel("Név", { exact: true }).fill("Regresszió Vásárló")
  await page.getByLabel("E-mail", { exact: true }).fill(email)
  await page.getByLabel("Jelszó", { exact: true }).fill(password)
  await screenshot("login-desktop")
  await page
    .getByRole("button", { name: "Fiók létrehozása", exact: true })
    .click()
  await expect(page).toHaveURL(base + "/checkout")
  userId = (await db.user.findUniqueOrThrow({ where: { email } })).id
  assert.equal(
    (await (await context.request.get(base + "/api/cart")).json())[0].quantity,
    1
  )
  assert.equal((await context.request.get(base + "/api/admin")).status(), 403)
  await page.goto(base + "/account")
  await page.getByLabel("Név", { exact: true }).fill("Regresszió Vásárló")
  await page.getByLabel("Telefonszám", { exact: true }).fill("+36301234567")
  await saveButton("Profil mentése")
  for (const [label, value] of [
    ["Cím neve", "Teszt otthon"],
    ["Címzett neve", "Regresszió Vásárló"],
    ["Címzett telefonszáma", "+36301234567"],
    ["Irányítószám", "1111"],
    ["Város", "Budapest"],
    ["Utca, házszám", "Teszt utca 12"],
  ]) {
    await page.getByLabel(label, { exact: true }).fill(value)
  }
  await page
    .getByRole("checkbox", { name: "Alapértelmezett cím", exact: true })
    .check()
  await saveButton("Cím mentése")
  await expect(page.getByText("Teszt utca 12", { exact: false })).toBeVisible()
  await page.getByRole("button", { name: "Szerkesztés", exact: true }).click()
  await page.getByLabel("Utca, házszám", { exact: true }).fill("Teszt utca 13")
  await saveButton("Cím mentése")
  assert.equal(
    (await db.address.findFirstOrThrow({ where: { userId } })).street,
    "Teszt utca 13"
  )
  await page.goto(base + "/checkout")
  await expect(page.getByLabel("Utca, házszám", { exact: true })).toHaveValue(
    "Teszt utca 13"
  )
  await page.evaluate(() => {
    window.dispatchEvent(new Event("keydown"))
    window.dispatchEvent(
      new KeyboardEvent("keydown", { key: "d", isComposing: true })
    )
  })
  await page.getByLabel("Teljes név", { exact: true }).pressSequentially(" d")
  await page
    .getByRole("checkbox", { name: "Eltérő számlázási cím", exact: true })
    .check()
  await page.getByLabel("Számlázási irányítószám", { exact: true }).fill("2222")
  await page.getByLabel("Számlázási város", { exact: true }).fill("Vecsés")
  await page
    .getByLabel("Számlázási utca, házszám", { exact: true })
    .fill("Másik utca 1")
  await page
    .getByRole("button", { name: "Rendelés ellenőrzése", exact: true })
    .click()
  await expect(
    page.getByRole("button", { name: "Fizetés Stripe-pal", exact: true })
  ).toBeEnabled()
  await screenshot("checkout-desktop")
  const customerBody = {
    name: "Regresszió Vásárló",
    email,
    phone: "+36301234567",
    shipping: {
      postalCode: "1111",
      city: "Budapest",
      street: "Teszt utca 13",
      country: "HU",
    },
    billing: {
      postalCode: "2222",
      city: "Vecsés",
      street: "Másik utca 1",
      country: "HU",
    },
    items: [{ productId: "fake", quantity: 99 }],
  }
  const quote = await post("/api/quote", customerBody)
  assert.equal(quote.status(), 200)
  assert.equal(
    (await quote.json()).subtotal,
    34990,
    "Client supplied cart must be ignored"
  )
  assert.equal(
    (await post("/api/quote", { ...customerBody, coupon: "NOTREAL" })).status(),
    400
  )
  const address = await db.address.findFirstOrThrow({ where: { userId } })
  // A different session must not edit another customer's address.
  const other = await browser.newContext()
  const otherEmail = `other-${tag}@example.com`
  try {
    await other.request.post(base + "/api/auth/sign-up/email", {
      headers: { Origin: base },
      data: { email: otherEmail, password, name: "Másik Vásárló" },
    })
    assert.equal(
      (
        await other.request.post(base + "/api/account", {
          headers: { Origin: base },
          data: {
            action: "address.save",
            id: address.id,
            data: { ...address, street: "Stolen" },
          },
        })
      ).status(),
      400
    )
  } finally {
    await other.close()
    await db.user.deleteMany({ where: { email: otherEmail } })
  }
  await db.user.update({ where: { id: userId }, data: { role: "ADMIN" } })
  await page.goto(base + "/admin/coupons")
  await page
    .getByLabel("Kuponkód", { exact: true })
    .fill("TEST" + tag.toUpperCase())
  await page.getByLabel("Kedvezmény", { exact: true }).fill("10")
  const saveCoupon = page.waitForResponse(
    (r) => r.url().endsWith("/api/admin") && r.request().method() === "POST"
  )
  await page.getByRole("button", { name: "Kupon mentése", exact: true }).click()
  assert.equal((await saveCoupon).status(), 200)
  couponId = (
    await db.coupon.findUniqueOrThrow({
      where: { code: "TEST" + tag.toUpperCase() },
    })
  ).id
  await page
    .getByText("TEST" + tag.toUpperCase(), { exact: true })
    .locator("..")
    .locator("..")
    .getByRole("button", { name: "Szerkesztés", exact: true })
    .click()
  await page.getByLabel("Kedvezmény", { exact: true }).fill("15")
  const editedCoupon = page.waitForResponse(
    (r) => r.url().endsWith("/api/admin") && r.request().method() === "POST"
  )
  await page.getByRole("button", { name: "Kupon mentése", exact: true }).click()
  assert.equal((await editedCoupon).status(), 200)
  const coupon = await db.coupon.findUniqueOrThrow({ where: { id: couponId } })
  assert.equal(
    (await db.coupon.findUniqueOrThrow({ where: { id: couponId } })).amount,
    15
  )
  const discounted = await post("/api/quote", {
    ...customerBody,
    coupon: coupon.code,
  })
  assert.equal((await discounted.json()).discount, 5248)
  // Stripe sandbox session creation and expiration, without charging a card.
  if (process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")) {
    const checkout = await post("/api/checkout", customerBody)
    assert.equal(checkout.status(), 200, await checkout.text())
    const pending = await db.order.findFirstOrThrow({
      where: { userId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
    })
    const cancel = await post(`/api/orders/${pending.id}`, {})
    assert.equal(cancel.status(), 200, await cancel.text())
    assert.equal(
      (await db.order.findUniqueOrThrow({ where: { id: pending.id } })).status,
      "CANCELLED"
    )
    console.log("PASS: real Stripe sandbox Checkout creation and expiration")
  }
  // Isolated paid-event fixture, not a real charge.
  const category = await db.category.findFirstOrThrow()
  const product = await db.product.create({
    data: {
      name: "Regressziós termék",
      slug: randomUUID(),
      description: "",
      categoryId: category.id,
      price: 1000,
      stock: 3,
      reserved: 1,
    },
  })
  fixtureProductId = product.id
  const cart = await db.cart.findUniqueOrThrow({ where: { userId } })
  await db.cartItem.create({
    data: { cartId: cart.id, productId: product.id, quantity: 1 },
  })
  const fixture = await db.order.create({
    data: {
      userId,
      cartId: cart.id,
      email,
      name: "Regresszió Vásárló",
      phone: "+36301234567",
      shipping: customerBody.shipping,
      billing: customerBody.billing,
      subtotal: 1000,
      discount: 0,
      shippingFee: 1490,
      total: 2490,
      expiresAt: new Date(Date.now() + 60000),
      sessionId: "cs_test_fixture_" + tag,
      emailSentAt: new Date(),
      items: {
        create: {
          productId: product.id,
          name: product.name,
          price: 1000,
          quantity: 1,
        },
      },
    },
  })
  fixtureOrderId = fixture.id
  const event = {
    id: fixture.sessionId,
    payment_status: "paid",
    currency: "huf",
    amount_total: 249000,
    payment_intent: "pi_fixture_" + tag,
    metadata: { orderId: fixture.id },
  } as unknown as Stripe.Checkout.Session
  await fulfill(event)
  await fulfill(event)
  assert.equal(
    (await db.product.findUniqueOrThrow({ where: { id: product.id } })).stock,
    2
  )
  assert.equal(
    (await db.product.findUniqueOrThrow({ where: { id: product.id } }))
      .reserved,
    0
  )
  assert.equal(
    await db.cartItem.count({
      where: { cartId: cart.id, productId: product.id },
    }),
    0
  )
  await page.goto(base + `/orders/${fixture.id}`)
  await page
    .getByLabel("Csomagazonosító", { exact: true })
    .fill("TEST-TRACK-123")
  await page
    .getByLabel("Belső megjegyzés", { exact: true })
    .fill("Regressziós csomag")
  const details = page.waitForResponse(
    (r) => r.url().endsWith("/api/admin") && r.request().method() === "POST"
  )
  await page
    .getByRole("button", { name: "Rendelési adatok mentése", exact: true })
    .click()
  assert.equal((await details).status(), 200)
  await page
    .getByRole("button", { name: "Állapot: Összekészítés alatt", exact: true })
    .click()
  await expect(
    page.getByRole("button", { name: "Állapot: Feladva", exact: true })
  ).toBeVisible()
  await page
    .getByRole("button", { name: "Állapot: Feladva", exact: true })
    .click()
  await expect(
    page.getByRole("button", { name: "Állapot: Kézbesítve", exact: true })
  ).toBeVisible()
  await screenshot("order-admin-desktop")
  assert.equal(
    (
      await post("/api/admin", {
        action: "order.status",
        id: fixture.id,
        data: { status: "PROCESSING" },
      })
    ).status(),
    400
  )
  for (const width of [390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    for (const path of [
      "/",
      "/category/audio",
      "/cart",
      "/checkout",
      "/login",
      "/account",
      "/admin",
      "/admin/orders",
      "/admin/coupons",
    ]) {
      await page.goto(base + path)
      await page.waitForLoadState("networkidle")
      await expect(page.locator("header")).toHaveCount(1)
      await expect(page.locator("footer")).toHaveCount(1)
      await noOverflow()
      if (width === 390 && (path === "/" || path === "/checkout"))
        await screenshot(path === "/" ? "storefront-mobile" : "checkout-mobile")
    }
  }
  assert.deepEqual([...errors], [], errors.join("\n"))
  console.log(
    "PASS: guest cart persistence and merge, email authentication, shared chrome, profile/address CRUD and isolation, checkout prefill, malformed/composing keys, server-priced cart, coupons, paid-event idempotency, fulfillment administration, 390/768/1440 responsive routes, console health"
  )
} finally {
  userId ??= (await db.user.findUnique({ where: { email } }))?.id
  if (userId) {
    const orders = await db.order.findMany({ where: { userId } })
    for (const order of orders) {
      if (
        order.status === "PENDING" &&
        order.sessionId &&
        !order.sessionId.startsWith("cs_test_fixture_")
      ) {
        try {
          await post(`/api/orders/${order.id}`, {})
        } catch {}
      }
    }
    await db.orderItem.deleteMany({ where: { order: { userId } } })
    await db.order.deleteMany({ where: { userId } })
    await db.user.delete({ where: { id: userId } })
  }
  if (fixtureOrderId)
    await db.order.deleteMany({ where: { id: fixtureOrderId } })
  if (fixtureProductId)
    await db.product.delete({ where: { id: fixtureProductId } })
  if (couponId) await db.coupon.delete({ where: { id: couponId } })
  await browser.close()
  await db.$disconnect()
}
