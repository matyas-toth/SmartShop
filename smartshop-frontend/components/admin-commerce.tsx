"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertTitle } from "@/components/ui/alert"
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { useCatalog } from "@/lib/catalog-store"
import { orderStatusLabel } from "@/lib/order-status"
import { formatPrice } from "@/lib/products"
type Coupon = {
  id: string
  code: string
  percent: boolean
  amount: number
  minimum: number
  limit: number
  used: number
  reserved: number
  active: boolean
  startsAt: string
  expiresAt: string | null
  productIds: string[]
  categoryIds: string[]
}
type Data = {
  orderCount: number
  metrics: { totalOrders: number; pendingOrders: number; revenue: number }
  orders: {
    id: string
    number: number
    name: string
    email: string
    status: string
    total: number
    createdAt: string
  }[]
  coupons: Coupon[]
  users: { id: string; email: string; name: string; role: string }[]
}
export function AdminCommerce({
  section,
}: {
  section: "orders" | "coupons" | "users"
}) {
  const [data, setData] = useState<Data>({
    orders: [],
    coupons: [],
    users: [],
    orderCount: 0,
    metrics: { totalOrders: 0, pendingOrders: 0, revenue: 0 },
  })
  const [editing, setEditing] = useState<Coupon | null>(null)
  const [formKey, setFormKey] = useState(0)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [message, setMessage] = useState("")
  const [pending, setPending] = useState(false)
  const [page, setPage] = useState(1)
  const catalog = useCatalog()
  const endpoint =
    "/api/admin?" +
    new URLSearchParams({ q: search, status, page: String(page) })
  async function refresh() {
    const r = await fetch(endpoint)
    if (!r.ok) throw new Error("Az adminadatok nem tölthetők be.")
    setData(await r.json())
  }
  useEffect(() => {
    const controller = new AbortController()
    fetch(endpoint, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw new Error("Az adminadatok nem tölthetők be.")
        return r.json()
      })
      .then(setData)
      .catch((e) => {
        if (e.name !== "AbortError") setMessage(e.message)
      })
    return () => controller.abort()
  }, [endpoint])
  async function mutate(
    action: string,
    id: string | undefined,
    input: unknown
  ) {
    setPending(true)
    setMessage("")
    try {
      const r = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id, data: input }),
      })
      const result = await r.json()
      if (!r.ok) throw new Error(result.error)
      await refresh()
      setMessage("A változtatásokat mentettük.")
      return true
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "A mentés nem sikerült.")
      return false
    } finally {
      setPending(false)
    }
  }
  const filtered = data.orders
  const pages = Math.max(1, Math.ceil(data.orderCount / 20))
  const current = Math.min(page, pages)
  const toLocal = (v?: string | null) =>
    v
      ? new Date(
          new Date(v).getTime() - new Date(v).getTimezoneOffset() * 60000
        )
          .toISOString()
          .slice(0, 16)
      : ""
  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 p-4 py-8 sm:p-6">
      {message ? (
        <Alert>
          <AlertTitle>{message}</AlertTitle>
        </Alert>
      ) : null}
      {section === "orders" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              ["Rendelések", String(data.metrics.totalOrders)],
              ["Fizetésre vár", String(data.metrics.pendingOrders)],
              ["Fizetett forgalom", formatPrice(data.metrics.revenue)],
            ].map(([label, value]) => (
              <Card key={label}>
                <CardHeader>
                  <CardTitle>{label}</CardTitle>
                </CardHeader>
                <CardContent>{value}</CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Rendelések</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  aria-label="Rendelés keresése"
                  placeholder="Név, e-mail vagy rendelésszám"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                />
                <NativeSelect
                  aria-label="Rendelés szűrése"
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value)
                    setPage(1)
                  }}
                >
                  <NativeSelectOption value="">
                    Minden állapot
                  </NativeSelectOption>
                  {Object.entries(orderStatusLabel).map(([key, label]) => (
                    <NativeSelectOption key={key} value={key}>
                      {label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Rendelés</TableHead>
                    <TableHead>Vásárló</TableHead>
                    <TableHead>Állapot</TableHead>
                    <TableHead>Összeg</TableHead>
                    <TableHead>Dátum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell>
                        <Link
                          className={buttonVariants({ variant: "link" })}
                          href={`/orders/${o.id}`}
                        >
                          #{o.number}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {o.name}
                        <div>{o.email}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {orderStatusLabel[o.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatPrice(o.total)}</TableCell>
                      <TableCell>
                        {new Date(o.createdAt).toLocaleDateString("hu-HU")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {!filtered.length ? <span>Nincs találat.</span> : null}
              <div className="flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  disabled={current === 1}
                  onClick={() => setPage(current - 1)}
                >
                  Előző
                </Button>
                <span>
                  {current} / {pages}
                </span>
                <Button
                  variant="outline"
                  disabled={current === pages}
                  onClick={() => setPage(current + 1)}
                >
                  Következő
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
      {section === "coupons" ? (
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Kuponok</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {data.coupons.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-3"
                >
                  <div>
                    <CardTitle>{c.code}</CardTitle>
                    <div>
                      {c.amount}
                      {c.percent ? "%" : " Ft"} · {c.used}/{c.limit}{" "}
                      felhasználás · {c.reserved} foglalás
                    </div>
                    <Badge variant={c.active ? "secondary" : "outline"}>
                      {c.active ? "Aktív" : "Inaktív"}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditing(c)
                      setFormKey((k) => k + 1)
                    }}
                  >
                    Szerkesztés
                  </Button>
                </div>
              ))}
              {!data.coupons.length ? "Még nincs kupon." : null}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>
                {editing ? "Kupon szerkesztése" : "Új kupon"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                key={formKey}
                className="flex flex-col gap-5"
                onSubmit={async (e) => {
                  e.preventDefault()
                  const f = new FormData(e.currentTarget)
                  const input = {
                    code: f.get("code"),
                    percent: f.get("type") === "percent",
                    amount: Number(f.get("amount")),
                    minimum: Number(f.get("minimum")),
                    limit: Number(f.get("limit")),
                    active: f.get("active") === "on",
                    startsAt: f.get("startsAt")
                      ? new Date(String(f.get("startsAt"))).toISOString()
                      : undefined,
                    expiresAt: f.get("expiresAt")
                      ? new Date(String(f.get("expiresAt"))).toISOString()
                      : null,
                    productIds: f.getAll("productIds"),
                    categoryIds: f.getAll("categoryIds"),
                  }
                  if (await mutate("coupon.save", editing?.id, input)) {
                    setEditing(null)
                    setFormKey((k) => k + 1)
                  }
                }}
              >
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="code">Kuponkód</FieldLabel>
                    <Input
                      id="code"
                      name="code"
                      defaultValue={editing?.code}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="coupon-type">Típus</FieldLabel>
                    <NativeSelect
                      id="coupon-type"
                      name="type"
                      defaultValue={
                        editing?.percent === false ? "fixed" : "percent"
                      }
                    >
                      <NativeSelectOption value="percent">
                        Százalék
                      </NativeSelectOption>
                      <NativeSelectOption value="fixed">
                        Forint
                      </NativeSelectOption>
                    </NativeSelect>
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[
                      ["amount", "Kedvezmény", editing?.amount ?? 10],
                      ["minimum", "Minimum kosárérték", editing?.minimum ?? 0],
                      ["limit", "Felhasználási limit", editing?.limit ?? 100],
                    ].map(([key, label, value]) => (
                      <Field key={key}>
                        <FieldLabel htmlFor={String(key)}>{label}</FieldLabel>
                        <Input
                          id={String(key)}
                          name={String(key)}
                          type="number"
                          min={key === "minimum" ? 0 : 1}
                          defaultValue={value}
                          required
                        />
                      </Field>
                    ))}
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="startsAt">
                        Érvényesség kezdete
                      </FieldLabel>
                      <Input
                        id="startsAt"
                        name="startsAt"
                        type="datetime-local"
                        defaultValue={toLocal(editing?.startsAt)}
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="expiresAt">Lejárat</FieldLabel>
                      <Input
                        id="expiresAt"
                        name="expiresAt"
                        type="datetime-local"
                        defaultValue={toLocal(editing?.expiresAt)}
                      />
                    </Field>
                  </div>
                  <Field orientation="horizontal">
                    <Checkbox
                      id="coupon-active"
                      name="active"
                      defaultChecked={editing?.active ?? true}
                    />
                    <FieldLabel htmlFor="coupon-active">Aktív kupon</FieldLabel>
                  </Field>
                  <FieldSet>
                    <FieldLegend>Jogosult kategóriák</FieldLegend>
                    <FieldGroup>
                      {catalog.categories.map((c) => (
                        <Field orientation="horizontal" key={c.id}>
                          <Checkbox
                            id={`coupon-category-${c.id}`}
                            name="categoryIds"
                            value={c.id}
                            defaultChecked={
                              editing?.categoryIds.includes(c.id) ?? false
                            }
                          />
                          <FieldLabel htmlFor={`coupon-category-${c.id}`}>
                            {c.name}
                          </FieldLabel>
                        </Field>
                      ))}
                    </FieldGroup>
                  </FieldSet>
                  <FieldSet>
                    <FieldLegend>Jogosult termékek</FieldLegend>
                    <FieldGroup>
                      {catalog.products.map((p) => (
                        <Field orientation="horizontal" key={p.id}>
                          <Checkbox
                            id={`coupon-product-${p.id}`}
                            name="productIds"
                            value={p.id}
                            defaultChecked={
                              editing?.productIds.includes(p.id) ?? false
                            }
                          />
                          <FieldLabel htmlFor={`coupon-product-${p.id}`}>
                            {p.name}
                          </FieldLabel>
                        </Field>
                      ))}
                    </FieldGroup>
                  </FieldSet>
                </FieldGroup>
                <div className="flex gap-3">
                  <Button type="submit" disabled={pending}>
                    Kupon mentése
                  </Button>
                  {editing ? (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setEditing(null)
                        setFormKey((k) => k + 1)
                      }}
                    >
                      Mégse
                    </Button>
                  ) : null}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}
      {section === "users" ? (
        <Card>
          <CardHeader>
            <CardTitle>Felhasználók</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {data.users.map((u) => (
              <div
                className="flex flex-wrap items-center justify-between gap-3"
                key={u.id}
              >
                <div>
                  {u.name}
                  <div>{u.email}</div>
                </div>
                <NativeSelect
                  aria-label={`${u.email} jogosultsága`}
                  disabled={pending}
                  value={u.role}
                  onChange={(e) =>
                    void mutate("user.role", u.id, { role: e.target.value })
                  }
                >
                  {[
                    ["CUSTOMER", "Vásárló"],
                    ["MANAGER", "Boltkezelő"],
                    ["ADMIN", "Admin"],
                  ].map(([key, label]) => (
                    <NativeSelectOption key={key} value={key}>
                      {label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </main>
  )
}
