"use client"
import Link from "next/link"
import {
  useCart,
  useCartReady,
  updateCartQuantity,
  removeFromCart,
} from "@/lib/cart-store"
import { useCatalog } from "@/lib/catalog-store"
import { ProductIcon } from "@/components/product-icon"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { formatPrice } from "@/lib/products"
export function CartPage() {
  const items = useCart()
  const ready = useCartReady()
  const catalog = useCatalog()
  const total = items.reduce(
    (sum, i) =>
      sum +
      (catalog.products.find((p) => p.id === i.productId)?.price ?? 0) *
        i.quantity,
    0
  )
  return (
    <main className="mx-auto grid max-w-7xl items-start gap-6 p-4 py-8 sm:p-6 lg:grid-cols-[2fr_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Kosár</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {!ready ? (
            <span>Kosár betöltése…</span>
          ) : !items.length ? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>A kosarad üres</EmptyTitle>
              </EmptyHeader>
              <Link href="/" className={buttonVariants()}>
                Válogatok
              </Link>
            </Empty>
          ) : (
            items.map((item) => {
              const p = catalog.products.find((p) => p.id === item.productId)
              return (
                <div
                  key={item.productId}
                  className="flex flex-wrap items-center gap-3"
                >
                  {p ? (
                    <>
                      <div className="w-20 shrink-0">
                        <ProductIcon
                          icon={p.icon}
                          image={p.image}
                          name={p.name}
                          ratio={1}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <Link href={`/product/${p.slug}`}>{p.name}</Link>
                        <div>{formatPrice(p.price)}</div>
                      </div>
                    </>
                  ) : (
                    <span>A termék már nem elérhető</span>
                  )}
                  <Input
                    aria-label={`${p?.name ?? "Termék"} mennyisége`}
                    className="w-20"
                    type="number"
                    min={1}
                    max={Math.min(99, p?.stock ?? 99)}
                    value={item.quantity}
                    onChange={(e) => {
                      const n = Number(e.target.value)
                      if (Number.isInteger(n) && n > 0)
                        void updateCartQuantity(item.productId, n)
                    }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void removeFromCart(item.productId)}
                  >
                    Eltávolítás
                  </Button>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Összesítő</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex justify-between gap-3">
            <span>Termékek</span>
            <span>{formatPrice(total)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span>Szállítás</span>
            <span>
              {!items.length
                ? formatPrice(0)
                : total >= 30000
                  ? "Ingyenes"
                  : formatPrice(1490)}
            </span>
          </div>
          <div className="flex justify-between gap-3">
            <CardTitle>Összesen</CardTitle>
            <CardTitle>
              {formatPrice(
                total + (total >= 30000 || !items.length ? 0 : 1490)
              )}
            </CardTitle>
          </div>
        </CardContent>
        <CardFooter>
          {items.length ? (
            <Link
              className={buttonVariants({ className: "w-full" })}
              href="/checkout"
            >
              Tovább a megrendeléshez
            </Link>
          ) : (
            <Link href="/" className={buttonVariants()}>
              Válogatok
            </Link>
          )}
        </CardFooter>
      </Card>
    </main>
  )
}
