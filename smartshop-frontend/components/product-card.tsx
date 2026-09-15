import Link from "next/link"

import { ProductCartButton } from "@/components/product-actions"
import { ProductIcon } from "@/components/product-icon"
import { Badge } from "@/components/ui/badge"
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
import { cn } from "@/lib/utils"
import {
  formatPrice,
  getStockLabel,
  type Category,
  type Product,
} from "@/lib/products"

export function ProductCard({
  product,
  category,
}: {
  product: Product
  category: Category
}) {
  return (
    <Card className="h-full" interactive>
      <CardHeader>
        <CardTitle>{product.name}</CardTitle>
        <CardDescription>{product.description}</CardDescription>
        <CardAction>
          <Badge variant="secondary">{category.name}</Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <Link
          href={`/product/${product.slug}`}
          aria-label={`${product.name} részletei`}
        >
          <ProductIcon icon={product.icon} />
        </Link>
      </CardContent>
      <CardFooter className="mt-auto flex-wrap justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <CardTitle className="tabular-nums">
            {formatPrice(product.price)}
          </CardTitle>
          <CardDescription>{getStockLabel(product.stock)}</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/product/${product.slug}`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            Részletek
          </Link>
          <ProductCartButton
            productId={product.id}
            productName={product.name}
            disabled={product.stock <= 0}
            size="sm"
          />
        </div>
      </CardFooter>
    </Card>
  )
}
