import Link from "next/link"
import { redirect } from "next/navigation"
import { currentUser } from "@/lib/server-access"
import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { buttonVariants } from "@/components/ui/button"
import { SignOut } from "@/components/sign-out"
import { ProfilePanel } from "@/components/profile-panel"
import { orderStatusLabel } from "@/lib/order-status"
export default async function AccountPage() {
  const user = await currentUser()
  if (!user) redirect("/login")
  const orders = await db.order.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  })
  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 p-4 py-8 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle>{user.name}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <SignOut />
          <Link className={buttonVariants()} href="/">
            Vásárlás
          </Link>
          {user.role !== "CUSTOMER" ? (
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/admin"
            >
              Adminisztráció
            </Link>
          ) : null}
        </CardContent>
      </Card>
      <ProfilePanel />
      <Card>
        <CardHeader>
          <CardTitle>Rendeléseim</CardTitle>
        </CardHeader>
      </Card>
      {orders.map((order) => (
        <Card key={order.id}>
          <CardHeader>
            <CardTitle>Rendelés #{order.number}</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href={`/orders/${order.id}`}>
              {orderStatusLabel[order.status]} ·{" "}
              {order.total.toLocaleString("hu-HU")} Ft
            </Link>
          </CardContent>
        </Card>
      ))}
      {!orders.length ? (
        <Card>
          <CardContent>Még nincs rendelésed.</CardContent>
        </Card>
      ) : null}
    </main>
  )
}
