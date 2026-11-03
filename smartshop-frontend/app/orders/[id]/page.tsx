import { notFound } from "next/navigation"
import Link from "next/link"
import { currentUser } from "@/lib/server-access"
import { db } from "@/lib/db"
import { fulfill, stripe } from "@/lib/payments"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table"
import { buttonVariants } from "@/components/ui/button"
import { OrderActions } from "@/components/order-actions"
import { OrderTracking } from "@/components/order-tracking"
import { AdminOrderPanel } from "@/components/admin-order-panel"
import { orderStatusLabel } from "@/lib/order-status"
import { formatPrice } from "@/lib/products"
import type { Prisma } from "@/generated/prisma/client"
function AddressCard({
  title,
  address,
}: {
  title: string
  address: Prisma.JsonValue
}) {
  const a = address as Record<string, string>
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {a.postalCode} {a.city}
        <div>{a.street}</div>
        <div>Magyarország</div>
      </CardContent>
    </Card>
  )
}
export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ token?: string; session_id?: string }>
}) {
  const { id } = await params
  const query = await searchParams
  const user = await currentUser()
  let order = await db.order.findUnique({
    where: { id },
    include: { items: true },
  })
  if (
    !order ||
    !(
      query.token === order.accessToken ||
      (user && (order.userId === user.id || user.role !== "CUSTOMER"))
    )
  )
    notFound()
  if (
    query.session_id &&
    query.session_id === order.sessionId &&
    order.status === "PENDING"
  ) {
    try {
      await fulfill(await stripe().checkout.sessions.retrieve(query.session_id))
    } catch {
      /* Signed webhook and reconciliation retry payment and email independently. */
    }
    order = await db.order.findUniqueOrThrow({
      where: { id },
      include: { items: true },
    })
  }
  const staff = user && user.role !== "CUSTOMER"
  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 p-4 py-8 sm:p-6">
      <Card>
        <CardHeader>
          <CardTitle>Rendelés #{order.number}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <Badge>{orderStatusLabel[order.status]}</Badge>
          <span>{order.createdAt.toLocaleString("hu-HU")}</span>
          <Link
            href={staff ? "/admin/orders" : "/account"}
            className={buttonVariants({ variant: "outline" })}
          >
            Rendelések
          </Link>
        </CardContent>
      </Card>
      <OrderTracking id={id} token={query.token} status={order.status} />
      <div className="grid min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Rendelt termékek</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Termék</TableHead>
                    <TableHead>Mennyiség</TableHead>
                    <TableHead>Egységár</TableHead>
                    <TableHead>Összeg</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((i) => (
                    <TableRow key={i.id}>
                      <TableCell>{i.name}</TableCell>
                      <TableCell>{i.quantity} db</TableCell>
                      <TableCell>{formatPrice(i.price)}</TableCell>
                      <TableCell>{formatPrice(i.price * i.quantity)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <div className="grid gap-6 sm:grid-cols-2">
            <AddressCard title="Szállítási cím" address={order.shipping} />
            <AddressCard title="Számlázási cím" address={order.billing} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Kapcsolattartó</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <div>{order.name}</div>
              <div>{order.email}</div>
              <div>{order.phone}</div>
              {order.note ? <div>Megjegyzés: {order.note}</div> : null}
              {order.trackingNumber ? (
                <div>Csomagazonosító: {order.trackingNumber}</div>
              ) : null}
            </CardContent>
          </Card>
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Összesítő</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {[
                ["Termékek", order.subtotal],
                ["Kedvezmény", -order.discount],
                ["Szállítás", order.shippingFee],
                ["Összesen", order.total],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-3">
                  <span>{label}</span>
                  <span>{formatPrice(Number(value))}</span>
                </div>
              ))}
              <OrderActions
                id={id}
                token={query.token}
                status={order.status}
                canCancel={Boolean(
                  query.token ||
                  user?.id === order.userId ||
                  user?.role === "ADMIN"
                )}
              />
            </CardContent>
          </Card>
          {staff ? (
            <AdminOrderPanel
              id={id}
              status={order.status}
              trackingNumber={order.trackingNumber}
              adminNote={order.adminNote}
              emailSentAt={order.emailSentAt?.toISOString() ?? null}
            />
          ) : null}
        </div>
      </div>
    </main>
  )
}
