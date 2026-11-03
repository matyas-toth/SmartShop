"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useCart, useCartReady } from "@/lib/cart-store"
import { useCatalog } from "@/lib/catalog-store"
import { ProductIcon } from "@/components/product-icon"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldLegend,
} from "@/components/ui/field"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { formatPrice } from "@/lib/products"
import { ShippingProgress } from "@/components/shipping-progress"
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/shipping"
type Address = {
  id: string
  label: string
  name: string
  phone: string
  postalCode: string
  city: string
  street: string
  isDefault: boolean
}
type Totals = {
  subtotal: number
  discount: number
  shippingFee: number
  total: number
}
export function CheckoutForm() {
  const items = useCart()
  const ready = useCartReady()
  const catalog = useCatalog()
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)
  const [totals, setTotals] = useState<Totals | null>(null)
  const [separateBilling, setSeparateBilling] = useState(false)
  const [account, setAccount] = useState<{
    user: { name: string; email: string; phone: string } | null
    addresses: Address[]
  }>({ user: null, addresses: [] })
  const [selected, setSelected] = useState("")
  useEffect(() => {
    fetch("/api/account")
      .then((r) => r.json())
      .then((a) => {
        setAccount(a)
        setSelected(a.addresses.find((x: Address) => x.isDefault)?.id ?? "")
      })
      .catch(() => {})
  }, [])
  const address = account.addresses.find((a) => a.id === selected)
  const subtotal = items.reduce(
    (sum, i) =>
      sum +
      (catalog.products.find((p) => p.id === i.productId)?.price ?? 0) *
        i.quantity,
    0
  )
  const cartKey = JSON.stringify(items)
  const [quotedCart, setQuotedCart] = useState("")
  const validQuote = totals && quotedCart === cartKey
  if (ready && !items.length)
    return (
      <main className="mx-auto max-w-4xl p-6">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>A kosarad üres</EmptyTitle>
          </EmptyHeader>
          <Link href="/" className={buttonVariants()}>
            Válogatok
          </Link>
        </Empty>
      </main>
    )
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <form
        className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]"
        onChange={() => setTotals(null)}
        onSubmit={async (event) => {
          event.preventDefault()
          setPending(true)
          setError("")
          const f = new FormData(event.currentTarget)
          const v = (key: string) => String(f.get(key) ?? "")
          const shipping = {
            postalCode: v("postalCode"),
            city: v("city"),
            street: v("street"),
            country: "HU",
          }
          try {
            const response = await fetch(
              validQuote ? "/api/checkout" : "/api/quote",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: v("name"),
                  expectedTotal: validQuote ? totals.total : undefined,
                  email: v("email"),
                  phone: v("phone"),
                  shipping,
                  billing: separateBilling
                    ? {
                        postalCode: v("billingPostalCode"),
                        city: v("billingCity"),
                        street: v("billingStreet"),
                        country: "HU",
                      }
                    : shipping,
                  note: v("note"),
                  coupon: v("coupon") || undefined,
                }),
              }
            )
            const result = await response.json()
            if (!response.ok) throw new Error(result.error)
            if (!validQuote) {
              setTotals(result)
              setQuotedCart(cartKey)
            } else {
              window.location.assign(result.url)
              return
            }
          } catch (e) {
            setTotals(null)
            setError(
              e instanceof Error ? e.message : "A rendelés nem indítható."
            )
          }
          setPending(false)
        }}
      >
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Kapcsolattartási adatok</CardTitle>
            </CardHeader>
            <CardContent>
              <FieldGroup key={account.user?.email ?? "guest"}>
                <Field>
                  <FieldLabel htmlFor="name">Teljes név</FieldLabel>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={account.user?.name}
                    autoComplete="name"
                    minLength={3}
                    required
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="email">E-mail</FieldLabel>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      defaultValue={account.user?.email}
                      autoComplete="email"
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="phone">Telefonszám</FieldLabel>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      defaultValue={account.user?.phone}
                      autoComplete="tel"
                      minLength={6}
                      required
                    />
                  </Field>
                </div>
              </FieldGroup>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Szállítási cím</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              {account.addresses.length ? (
                <Field>
                  <FieldLabel htmlFor="saved-address">Mentett cím</FieldLabel>
                  <NativeSelect
                    id="saved-address"
                    value={selected}
                    onChange={(e) => {
                      setSelected(e.target.value)
                      setTotals(null)
                    }}
                  >
                    <NativeSelectOption value="">Új cím</NativeSelectOption>
                    {account.addresses.map((a) => (
                      <NativeSelectOption key={a.id} value={a.id}>
                        {a.label} · {a.street}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
              ) : null}
              <FieldGroup key={selected}>
                <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
                  {[
                    ["postalCode", "Irányítószám", "postal-code"],
                    ["city", "Város", "address-level2"],
                  ].map(([key, label, complete]) => (
                    <Field key={key}>
                      <FieldLabel htmlFor={key}>{label}</FieldLabel>
                      <Input
                        id={key}
                        name={key}
                        defaultValue={address?.[key as "postalCode" | "city"]}
                        autoComplete={complete}
                        required
                        pattern={key === "postalCode" ? "[0-9]{4}" : undefined}
                      />
                    </Field>
                  ))}
                </div>
                <Field>
                  <FieldLabel htmlFor="street">Utca, házszám</FieldLabel>
                  <Input
                    id="street"
                    name="street"
                    defaultValue={address?.street}
                    autoComplete="street-address"
                    minLength={3}
                    required
                  />
                </Field>
                <Field orientation="horizontal">
                  <Checkbox
                    id="separate-billing"
                    checked={separateBilling}
                    onCheckedChange={(checked) => {
                      setSeparateBilling(checked)
                      setTotals(null)
                    }}
                  />
                  <FieldLabel htmlFor="separate-billing">
                    Eltérő számlázási cím
                  </FieldLabel>
                </Field>
                {separateBilling ? (
                  <FieldSet>
                    <FieldLegend>Számlázási cím</FieldLegend>
                    <FieldGroup>
                      {[
                        ["billingPostalCode", "Számlázási irányítószám"],
                        ["billingCity", "Számlázási város"],
                        ["billingStreet", "Számlázási utca, házszám"],
                      ].map(([key, label]) => (
                        <Field key={key}>
                          <FieldLabel htmlFor={key}>{label}</FieldLabel>
                          <Input
                            id={key}
                            name={key}
                            required
                            pattern={
                              key === "billingPostalCode"
                                ? "[0-9]{4}"
                                : undefined
                            }
                          />
                        </Field>
                      ))}
                    </FieldGroup>
                  </FieldSet>
                ) : null}
                <Field>
                  <FieldLabel htmlFor="note">Megjegyzés</FieldLabel>
                  <Input id="note" name="note" maxLength={1000} />
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>
        </div>
        <Card className="lg:sticky lg:top-6">
          <CardHeader>
            <CardTitle>Rendelés összesítése</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <ShippingProgress
              amount={validQuote ? totals.subtotal - totals.discount : subtotal}
            />
            {items.map((item) => {
              const p = catalog.products.find((p) => p.id === item.productId)
              return p ? (
                <div key={p.id} className="flex items-center gap-3">
                  <div className="w-16 shrink-0">
                    <ProductIcon
                      icon={p.icon}
                      image={p.image}
                      name={p.name}
                      ratio={1}
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <Link href={`/product/${p.slug}`}>{p.name}</Link>
                    <Badge variant="secondary">{item.quantity} db</Badge>
                  </div>
                  <span>{formatPrice(p.price * item.quantity)}</span>
                </div>
              ) : null
            })}
            <Separator />
            <Field>
              <FieldLabel htmlFor="coupon">Kuponkód</FieldLabel>
              <Input id="coupon" name="coupon" />
            </Field>
            <Separator />
            <div className="flex justify-between gap-3">
              <span>Termékek</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {validQuote ? (
              <>
                <div className="flex justify-between gap-3">
                  <span>Kedvezmény</span>
                  <span>−{formatPrice(totals.discount)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span>Szállítás</span>
                  <span>
                    {totals.shippingFee
                      ? formatPrice(totals.shippingFee)
                      : "Ingyenes"}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between gap-3">
                  <CardTitle>Fizetendő</CardTitle>
                  <CardTitle>{formatPrice(totals.total)}</CardTitle>
                </div>
              </>
            ) : (
              <div className="flex justify-between gap-3">
                <span>Szállítás</span>
                <span>
                  {subtotal >= FREE_SHIPPING_THRESHOLD
                    ? "Ingyenes"
                    : formatPrice(SHIPPING_FEE)}
                </span>
              </div>
            )}
            {error ? (
              <Alert variant="destructive">
                <AlertTitle>{error}</AlertTitle>
              </Alert>
            ) : null}
          </CardContent>
          <CardFooter className="flex-col items-stretch gap-3">
            <Button type="submit" disabled={pending || !ready || !items.length}>
              {pending
                ? "Feldolgozás…"
                : validQuote
                  ? "Fizetés Stripe-pal"
                  : "Rendelés ellenőrzése"}
            </Button>
            <Link className={buttonVariants({ variant: "ghost" })} href="/cart">
              Vissza a kosárhoz
            </Link>
          </CardFooter>
        </Card>
      </form>
    </main>
  )
}
