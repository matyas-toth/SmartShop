import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { db } from "@/lib/db"
import { Resend } from "resend"

export const ADMIN_EMAIL = "matyastoth.mail@gmail.com"
export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 12,
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM)
        throw new Error("Resend nincs beállítva.")
      const result = await new Resend(process.env.RESEND_API_KEY).emails.send({
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: "SmartShop jelszócsere",
        text: `A jelszó módosításához nyisd meg ezt a hivatkozást: ${url}`,
      })
      if (result.error) throw new Error(result.error.message)
    },
  },
  socialProviders:
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {},
  user: {
    additionalFields: {
      role: { type: "string", defaultValue: "CUSTOMER", input: false },
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      allowDifferentEmails: false,
      requireLocalEmailVerified: false,
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (user.email.toLowerCase() === ADMIN_EMAIL && !user.emailVerified)
            throw new Error("Az adminfiókot a seed parancs hozza létre.")
          return {
            data: {
              ...user,
              role:
                user.email.toLowerCase() === ADMIN_EMAIL && user.emailVerified
                  ? "ADMIN"
                  : "CUSTOMER",
            },
          }
        },
      },
    },
  },
})
