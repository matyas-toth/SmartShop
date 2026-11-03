import "dotenv/config"
import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import sharp from "sharp"
import { db } from "../lib/db"

const base = process.env.BETTER_AUTH_URL ?? "http://localhost:3000"
const email = `image-test-${randomUUID()}@example.com`
const password = randomUUID() + randomUUID()
let userId: string | undefined
let productId: string | undefined
try {
  const signup = await fetch(base + "/api/auth/sign-up/email", {
    method: "POST",
    headers: { Origin: base, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name: "Image upload test" }),
  })
  assert.equal(signup.status, 200, await signup.text())
  const user = await db.user.findUniqueOrThrow({ where: { email } })
  userId = user.id
  const login = await fetch(base + "/api/auth/sign-in/email", {
    method: "POST",
    headers: { Origin: base, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  assert.equal(login.status, 200)
  const cookie = login.headers
    .getSetCookie()
    .map((v) => v.split(";")[0])
    .join("; ")
  assert.ok(cookie)
  const category = await db.category.findFirstOrThrow()
  const product = await db.product.create({
    data: {
      slug: randomUUID(),
      name: "Image test",
      description: "",
      price: 1000,
      stock: 1,
      categoryId: category.id,
    },
  })
  productId = product.id
  const path = `${base}/api/products/${product.id}/image`
  const png = await sharp({
    create: { width: 16, height: 16, channels: 3, background: "#008060" },
  })
    .png()
    .toBuffer()
  const request = (method: string, bytes?: Uint8Array, authenticated = true) =>
    fetch(path, {
      method,
      headers: {
        Origin: base,
        ...(authenticated ? { Cookie: cookie } : {}),
        "Content-Type": "image/png",
      },
      body: bytes ? new Uint8Array(bytes) : undefined,
    })
  assert.equal((await request("PUT", png, false)).status, 403)
  assert.equal(
    (await request("PUT", png)).status,
    403,
    "Customer must not upload"
  )
  await db.user.update({ where: { id: user.id }, data: { role: "MANAGER" } })
  assert.equal((await fetch(path)).status, 404)
  const upload = await request("PUT", png)
  assert.equal(upload.status, 200, await upload.clone().text())
  const uploaded = await upload.json()
  assert.deepEqual(Object.keys(uploaded), ["image"])
  assert.ok(uploaded.image.startsWith("/api/products/"))
  const stored = await db.productImage.findUniqueOrThrow({
    where: { productId: product.id },
  })
  assert.ok(stored.data instanceof Uint8Array)
  const get = await fetch(base + uploaded.image)
  assert.equal(get.headers.get("content-type"), "image/webp")
  const downloaded = Buffer.from(await get.arrayBuffer())
  assert.deepEqual(downloaded, Buffer.from(stored.data))
  assert.equal((await sharp(downloaded).metadata()).format, "webp")
  const etag = get.headers.get("etag")!
  assert.equal(
    (await fetch(path, { headers: { "If-None-Match": etag } })).status,
    304
  )
  const replacement = await sharp({
    create: { width: 20, height: 20, channels: 3, background: "#112233" },
  })
    .png()
    .toBuffer()
  const replace = await request("PUT", replacement)
  assert.equal(replace.status, 200)
  assert.notEqual((await replace.json()).image, uploaded.image)
  assert.equal((await request("PUT", Buffer.from("<svg></svg>"))).status, 400)
  assert.equal(
    (await request("PUT", new Uint8Array(5 * 1024 * 1024 + 1))).status,
    413
  )
  const catalog = await (await fetch(base + "/api/catalog")).json()
  const listed = catalog.products.find(
    (p: { id: string }) => p.id === product.id
  )
  assert.equal(typeof listed.image, "string")
  assert.equal(listed.imageAsset, undefined)
  assert.equal(listed.data, undefined)
  if (process.env.PLAYWRIGHT_MODULE) {
    const { chromium } = await import(process.env.PLAYWRIGHT_MODULE)
    const browser = await chromium.launch({ channel: "msedge", headless: true })
    try {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 1000 },
      })
      await context.addCookies(
        cookie.split("; ").map((pair) => {
          const index = pair.indexOf("=")
          return {
            name: pair.slice(0, index),
            value: pair.slice(index + 1),
            url: base,
          }
        })
      )
      const page = await context.newPage()
      const errors: string[] = []
      page.on("pageerror", (e: Error) => errors.push(e.message))
      await page.goto(base + "/admin")
      await page
        .getByRole("button", { name: "Image test szerkesztése", exact: true })
        .click()
      await page
        .getByLabel("Termékkép", { exact: true })
        .setInputFiles({ name: "test.png", mimeType: "image/png", buffer: png })
      await page
        .getByRole("status")
        .filter({ hasText: "A kép feltöltve." })
        .waitFor()
      const preview = page.getByRole("img", { name: "Image test", exact: true })
      await preview.waitFor()
      assert.ok(
        await preview.evaluate(
          (img: HTMLImageElement) => img.complete && img.naturalWidth > 0
        )
      )
      await page.screenshot({
        path: process.env.TEMP + "/smartshop-image-admin.png",
      })
      await page.goto(base + "/product/" + product.slug)
      const detail = page.getByRole("img", { name: "Image test", exact: true })
      await detail.waitFor()
      await detail.evaluate((img: HTMLImageElement) => img.decode())
      await page.screenshot({
        path: process.env.TEMP + "/smartshop-image-product.png",
      })
      await page.setViewportSize({ width: 390, height: 844 })
      await page.screenshot({
        path: process.env.TEMP + "/smartshop-image-mobile.png",
      })
      assert.deepEqual(errors, [])
      console.log(
        "PASS: browser admin upload, decoded preview, product page image, mobile rendering, no runtime errors"
      )
    } finally {
      await browser.close()
    }
  }
  assert.equal((await request("DELETE")).status, 204)
  assert.equal((await fetch(path)).status, 404)
  console.log(
    "PASS: authorization, binary DB roundtrip, image decoding, ETag, replacement, invalid and oversized input, URL-only catalog, deletion"
  )
} finally {
  if (productId) await db.product.delete({ where: { id: productId } })
  if (userId) await db.user.delete({ where: { id: userId } })
  await db.$disconnect()
}
