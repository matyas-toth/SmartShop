"use client"

import { PackageOpenIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { ProductCard } from "@/components/product-card"
import { StoreHeader } from "@/components/store-header"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item"
import { useCatalog } from "@/lib/catalog-store"

export function Storefront() {
  const catalog = useCatalog()

  return (
    <div className="min-h-svh">
      <StoreHeader />

      <main className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle>Fedezd fel a hétköznapok kedvenceit</CardTitle>
            <CardDescription>
              Válogatott technológiai és életmód termékek egy helyen.
            </CardDescription>
            <CardAction>
              <Badge variant="outline">{catalog.products.length} termék</Badge>
            </CardAction>
          </CardHeader>
        </Card>

        {catalog.categories.map((category) => {
          const categoryProducts = catalog.products.filter(
            (product) => product.categoryId === category.id
          )

          return (
            <section
              key={category.id}
              id={category.slug}
              aria-labelledby={`${category.slug}-heading`}
              className="flex scroll-mt-4 flex-col gap-4"
            >
              <Item size="sm">
                <ItemContent>
                  <ItemTitle id={`${category.slug}-heading`}>
                    {category.name}
                  </ItemTitle>
                  <ItemDescription>
                    {categoryProducts.length} elérhető termék
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Badge variant="secondary">
                    {categoryProducts.length} db
                  </Badge>
                </ItemActions>
              </Item>

              {categoryProducts.length > 0 ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {categoryProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      category={category}
                    />
                  ))}
                </div>
              ) : (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <HugeiconsIcon icon={PackageOpenIcon} strokeWidth={1.5} />
                    </EmptyMedia>
                    <EmptyTitle>Hamarosan érkezik</EmptyTitle>
                    <EmptyDescription>
                      Ebben a kategóriában még nincs megjeleníthető termék.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              )}
            </section>
          )
        })}
      </main>
    </div>
  )
}
