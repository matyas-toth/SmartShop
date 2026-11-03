import { headers } from "next/headers"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function currentUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session ? db.user.findUnique({ where: { id: session.user.id } }) : null
}
export async function requireManager() {
  const user = await currentUser()
  if (!user || !["MANAGER", "ADMIN"].includes(user.role))
    throw new Error("Nincs jogosultság.")
  return user
}
export function checkOrigin(request: Request) {
  if (
    request.headers.get("origin") !==
    new URL(process.env.BETTER_AUTH_URL ?? request.url).origin
  ) {
    throw new Error("Érvénytelen kérés.")
  }
}
