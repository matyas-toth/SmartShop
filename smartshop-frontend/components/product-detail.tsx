"use client"

import Link from "next/link"

import { ProductCartButton } from "@/components/product-actions"
import { ProductIcon } from "@/components/product-icon"
import { Badge } from "@/components/ui/badge"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item"
import { useCatalog, useCatalogReady } from "@/lib/catalog-store"
import { Skeleton } from "@/components/ui/skeleton"
import { formatPrice, getStockLabel } from "@/lib/products"
import { cn } from "@/lib/utils"

export function ProductDetail({ slug }: { slug: string }) {
  const catalog = useCatalog()
  const ready = useCatalogReady()
  if (!ready)
    return (
      <main className="mx-auto grid max-w-7xl gap-6 p-6 md:grid-cols-2">
        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </main>
    )
  const product = catalog.products.find((item) => item.slug === slug)

  if (!product) {
    return (
      <div className="min-h-svh">
        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <Empty>
            <EmptyHeader>
              <EmptyTitle>A termék nem található</EmptyTitle>
              <EmptyDescription>
                Lehet, hogy a terméket időközben törölték vagy átnevezték.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Link href="/" className={cn(buttonVariants())}>
                Vissza a kínálathoz
              </Link>
            </EmptyContent>
          </Empty>
        </main>
      </div>
    )
  }

  const category = catalog.categories.find(
    (item) => item.id === product.categoryId
  )

  return (
    <div className="min-h-svh">
      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/" />}>
                Főoldal
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            {category ? (
              <>
                <BreadcrumbItem>
                  <BreadcrumbLink
                    render={<Link href={`/category/${category.slug}`} />}
                  >
                    {category.name}
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
              </>
            ) : null}
            <BreadcrumbItem>
              <BreadcrumbPage>{product.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardContent>
              <ProductIcon
                icon={product.icon}
                image={product.image}
                name={product.name}
                ratio={1}
                size="lg"
                eager
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{product.name}</CardTitle>
              <CardDescription>{product.description}</CardDescription>
              <CardAction>
                <Badge variant="secondary">{category?.name ?? "Egyéb"}</Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-5">
              <Item variant="muted">
                <ItemContent>
                  <ItemDescription>Ár</ItemDescription>
                  <ItemTitle className="tabular-nums">
                    {formatPrice(product.price)}
                  </ItemTitle>
                </ItemContent>
                <Badge variant={product.stock > 0 ? "default" : "destructive"}>
                  {getStockLabel(product.stock)} · {product.stock} db
                </Badge>
              </Item>
            </CardContent>
            <CardFooter>
              <ProductCartButton
                productId={product.id}
                productName={product.name}
                disabled={product.stock <= 0}
                fullWidth
                size="lg"
              />
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  )
}
