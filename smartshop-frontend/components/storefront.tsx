"use client"
import { useState } from "react"
import Link from "next/link"
import { ProductCard } from "@/components/product-card"
import { useCatalog, useCatalogReady } from "@/lib/catalog-store"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
export function Storefront({ categorySlug }: { categorySlug?: string }) {
  const catalog = useCatalog()
  const ready = useCatalogReady()
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState("name")
  const [page, setPage] = useState(1)
  const category = catalog.categories.find((c) => c.slug === categorySlug)
  const products = catalog.products
    .filter(
      (p) =>
        (!categorySlug || p.categoryId === category?.id) &&
        (p.name + " " + p.description)
          .toLocaleLowerCase("hu")
          .includes(search.toLocaleLowerCase("hu"))
    )
    .sort((a, b) =>
      sort === "price-up"
        ? a.price - b.price
        : sort === "price-down"
          ? b.price - a.price
          : a.name.localeCompare(b.name, "hu")
    )
  const pages = Math.max(1, Math.ceil(products.length / 12))
  const current = Math.min(page, pages)
  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
      <Card>
        <CardHeader>
          <CardTitle>{category?.name ?? "Összes termék"}</CardTitle>
        </CardHeader>
      </Card>
      {!categorySlug ? (
        <nav className="flex flex-wrap gap-2" aria-label="Kategóriaválasztó">
          {catalog.categories.map((c) => (
            <Link
              key={c.id}
              className={buttonVariants({ variant: "outline", size: "sm" })}
              href={`/category/${c.slug}`}
            >
              {c.name}
            </Link>
          ))}
        </nav>
      ) : (
        <Link href="/" className={buttonVariants({ variant: "link" })}>
          Összes termék
        </Link>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input
          className="sm:max-w-md"
          aria-label="Termékek szűrése"
          placeholder="Keresés a termékek között"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
        <NativeSelect
          aria-label="Rendezés"
          value={sort}
          onChange={(e) => {
            setSort(e.target.value)
            setPage(1)
          }}
        >
          <NativeSelectOption value="name">Név szerint</NativeSelectOption>
          <NativeSelectOption value="price-up">
            Ár szerint növekvő
          </NativeSelectOption>
          <NativeSelectOption value="price-down">
            Ár szerint csökkenő
          </NativeSelectOption>
        </NativeSelect>
      </div>
      {!ready ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton className="h-72" key={i} />
          ))}
        </div>
      ) : products.length ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {products
            .slice((current - 1) * 12, current * 12)
            .map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                eager={index < 4}
              />
            ))}
        </div>
      ) : (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Nincs találat</EmptyTitle>
          </EmptyHeader>
        </Empty>
      )}
      {pages > 1 ? (
        <nav
          className="flex items-center justify-center gap-4"
          aria-label="Lapozás"
        >
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
        </nav>
      ) : null}
    </main>
  )
}
