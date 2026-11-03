import "dotenv/config"
import assert from "node:assert/strict"
import { chromium, expect as baseExpect } from "@playwright/test"
import sharp from "sharp"
import { randomUUID } from "node:crypto"
import { db } from "../lib/db"
const expect = baseExpect.configure({ timeout: 15000 })
const base = process.env.BETTER_AUTH_URL ?? "http://localhost:3000"
const tag = randomUUID().slice(0, 8),
  email = `products-${tag}@example.com`,
  name = "Teszt termék " + tag
const browser = await chromium.launch({ channel: "msedge", headless: true })
const context = await browser.newContext({
  viewport: { width: 1440, height: 1100 },
})
const page = await context.newPage()
const errors: string[] = []
page.on("pageerror", (e) => errors.push(e.message))
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text())
})
let userId: string | undefined, productId: string | undefined
const categoryIds: string[] = []
async function post(action: string, id: string | undefined, data: unknown) {
  return context.request.post(base + "/api/admin", {
    headers: { Origin: base },
    data: { action, id, data },
  })
}
try {
  const signup = await context.request.post(base + "/api/auth/sign-up/email", {
    headers: { Origin: base },
    data: {
      email,
      password: randomUUID() + randomUUID(),
      name: "Product test",
    },
  })
  assert.equal(signup.status(), 200)
  userId = (await db.user.findUniqueOrThrow({ where: { email } })).id
  await db.user.update({ where: { id: userId }, data: { role: "MANAGER" } })
  await page.goto(base + "/admin/users")
  await expect(page.getByText("Ez az oldal nem található", { exact: true })).toBeVisible()
  assert.deepEqual((await (await context.request.get(base + "/api/admin")).json()).users, [])
  for (const suffix of ["A", "B"]) {
    const categoryName = `ZZ ${suffix} ${tag}`
    assert.equal(
      (
        await post("category.create", undefined, { name: categoryName })
      ).status(),
      200
    )
    categoryIds.push(
      (await db.category.findFirstOrThrow({ where: { name: categoryName } })).id
    )
  }
  await page.goto(base + "/admin")
  const source = page
    .locator('[data-slot="card"]')
    .filter({ has: page.getByText("ZZ A " + tag, { exact: true }) })
  const target = page
    .locator('[data-slot="card"]')
    .filter({ has: page.getByText("ZZ B " + tag, { exact: true }) })
  await source.getByRole("button", { name: "Új termék", exact: true }).click()
  await page.getByLabel("Terméknév", { exact: true }).fill(name)
  await page
    .getByLabel("Leírás", { exact: true })
    .fill("Teljes admin regresszió")
  await page.getByLabel("Ár (Ft)", { exact: true }).fill("9990")
  await page.getByLabel("Készlet", { exact: true }).fill("7")
  await page.getByRole("button", { name: "Mentés", exact: true }).click()
  await expect(page.getByRole("dialog")).toHaveCount(0)
  productId = (await db.product.findFirstOrThrow({ where: { name } })).id
  await page
    .getByRole("button", { name: name + " szerkesztése", exact: true })
    .click()
  const png = await sharp({
    create: { width: 100, height: 100, channels: 3, background: "#237a55" },
  })
    .png()
    .toBuffer()
  await page
    .getByLabel("Termékkép", { exact: true })
    .setInputFiles({ name: "test.png", mimeType: "image/png", buffer: png })
  await page
    .getByRole("status")
    .filter({ hasText: "A kép feltöltve." })
    .waitFor()
  await page.getByLabel("Ár (Ft)", { exact: true }).fill("10990")
  await page.getByRole("button", { name: "Mentés", exact: true }).click()
  await expect(page.getByRole("dialog")).toHaveCount(0)
  assert.equal(
    (await db.product.findUniqueOrThrow({ where: { id: productId } })).price,
    10990
  )
  const draggable = page.locator('[draggable="true"]').filter({ hasText: name })
  await draggable.dragTo(target)
  await expect(target.getByText(name, { exact: true })).toBeVisible()
  assert.equal(
    (await db.product.findUniqueOrThrow({ where: { id: productId } }))
      .categoryId,
    categoryIds[1]
  )
  assert.equal(
    (await post("category.delete", categoryIds[1], {})).status(),
    400,
    "Non-empty category cannot be archived"
  )
  await page
    .getByRole("button", { name: name + " törlése", exact: true })
    .click()
  await page.getByRole("button", { name: "Törlés", exact: true }).click()
  await expect(page.getByRole("dialog")).toHaveCount(0)
  assert.equal(
    (await db.product.findUniqueOrThrow({ where: { id: productId } })).active,
    false
  )
  for (const id of categoryIds)
    assert.equal((await post("category.delete", id, {})).status(), 200)
  const catalog = await (
    await context.request.get(base + "/api/catalog")
  ).json()
  assert.equal(
    catalog.categories.some((c: { id: string }) => categoryIds.includes(c.id)),
    false
  )
  await page.waitForLoadState("networkidle")
  assert.deepEqual([...errors], [])
  console.log(
    "PASS: manager role, product creation/edit/image upload, real drag across categories, protected nonempty category, product/category archive with history preserved, clean browser console"
  )
} finally {
  await browser.close()
  productId ??= (await db.product.findFirst({ where: { name } }))?.id
  if (productId) await db.product.delete({ where: { id: productId } })
  await db.category.deleteMany({ where: { id: { in: categoryIds } } })
  if (userId) await db.user.delete({ where: { id: userId } })
  await db.$disconnect()
}
