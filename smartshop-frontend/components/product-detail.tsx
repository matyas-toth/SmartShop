"use client"

import {
  DeliveryTruck02Icon,
  PackageCheckIcon,
  ShieldEnergyIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"

import { ProductCartButton } from "@/components/product-actions"
import { ProductIcon } from "@/components/product-icon"
import { StoreHeader } from "@/components/store-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
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
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { useCatalog } from "@/lib/catalog-store"
import { formatPrice, getStockLabel } from "@/lib/products"
import { cn } from "@/lib/utils"

const benefits = [
  {
    title: "Gyors kosárkezelés",
    description: "A kosár tartalma azonnal frissül és helyben megmarad.",
    icon: PackageCheckIcon,
  },
  {
    title: "Mock kiszállítás",
    description: "A szállítási folyamat egy későbbi mérföldkő része lesz.",
    icon: DeliveryTruck02Icon,
  },
  {
    title: "Biztonságos demó",
    description: "Nincs valódi fizetés vagy külső adattovábbítás.",
    icon: ShieldEnergyIcon,
  },
]

export function ProductDetail({ slug }: { slug: string }) {
  const catalog = useCatalog()
  const product = catalog.products.find((item) => item.slug === slug)

  if (!product) {
    return (
      <div className="min-h-svh">
        <StoreHeader />
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
      <StoreHeader />
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
                  <BreadcrumbLink render={<Link href={`/#${category.slug}`} />}>
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
              <ProductIcon icon={product.icon} ratio={1} size="lg" />
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
              <ItemGroup>
                {benefits.map((benefit) => (
                  <Item key={benefit.title} size="sm">
                    <ItemMedia variant="icon">
                      <HugeiconsIcon icon={benefit.icon} strokeWidth={1.5} />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{benefit.title}</ItemTitle>
                      <ItemDescription>{benefit.description}</ItemDescription>
                    </ItemContent>
                  </Item>
                ))}
              </ItemGroup>
              <Alert>
                <AlertTitle>Demó termékoldal</AlertTitle>
                <AlertDescription>
                  A termék és a készlet az adminfelületről, localStorage-ban
                  módosítható.
                </AlertDescription>
              </Alert>
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
