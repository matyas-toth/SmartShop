import "dotenv/config"
import assert from "node:assert/strict"
import { randomUUID } from "node:crypto"
import { betterAuth } from "better-auth"
import { createAuthEndpoint } from "better-auth/api"
import { handleOAuthUserInfo } from "better-auth/oauth2"
import { auth } from "../lib/auth"
import { db } from "../lib/db"
const email = `link-test-${randomUUID()}@example.com`
let verified = false
// This callback exists only inside this test instance, never in the app.
const testAuth = betterAuth({
  ...auth.options,
  plugins: [
    {
      id: "verified-provider-regression",
      endpoints: {
        callbackFixture: createAuthEndpoint(
          "/fixture-callback",
          { method: "POST" },
          async (ctx) => {
            const result = await handleOAuthUserInfo(ctx, {
              userInfo: {
                id: "google-fixture-" + email,
                email,
                name: "Google fixture",
                emailVerified: verified,
              },
              account: {
                accountId: "google-fixture-" + email,
                providerId: "google",
              },
              deferNonDatabaseWrites: true,
            })
            return ctx.json({
              error: result.error,
              userId: result.data?.user.id,
            })
          }
        ),
      },
    },
  ],
})
try {
  await testAuth.api.signUpEmail({
    body: { email, password: randomUUID() + randomUUID(), name: "Link test" },
  })
  const user = await db.user.findUniqueOrThrow({ where: { email } })
  assert.equal(user.emailVerified, false)
  await db.user.update({ where: { id: user.id }, data: { role: "ADMIN" } })
  const callback = () =>
    testAuth.handler(
      new Request(
        (process.env.BETTER_AUTH_URL ?? "http://localhost:3000") +
          "/api/auth/fixture-callback",
        {
          method: "POST",
          headers: {
            Origin: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
          },
        }
      )
    )
  const rejected = await (await callback()).json()
  assert.ok(rejected.error, "An unverified provider identity must not link")
  verified = true
  const linked = await (await callback()).json()
  assert.equal(linked.error, null)
  assert.equal(linked.userId, user.id)
  assert.equal(await db.account.count({ where: { userId: user.id } }), 2)
  assert.equal(
    (await db.user.findUniqueOrThrow({ where: { id: user.id } })).role,
    "ADMIN"
  )
  console.log(
    "PASS: unverified local email + verified Google identity links to same account; unverified provider rejected; admin role preserved"
  )
} finally {
  await db.user.deleteMany({ where: { email } })
  await db.$disconnect()
}
