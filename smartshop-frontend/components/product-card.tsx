import Link from "next/link"
import { ProductCartButton } from "@/components/product-actions"
import { ProductIcon } from "@/components/product-icon"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { formatPrice, getStockLabel, type Product } from "@/lib/products"
export function ProductCard({
  product,
  eager = false,
}: {
  product: Product
  eager?: boolean
}) {
  return (
    <Card className="h-full gap-3 py-4" interactive>
      <CardContent className="px-3 sm:px-4">
        <Link
          href={`/product/${product.slug}`}
          aria-label={`${product.name} részletei`}
        >
          <ProductIcon
            icon={product.icon}
            image={product.image}
            name={product.name}
            ratio={4 / 3}
            eager={eager}
          />
        </Link>
      </CardContent>
      <CardHeader className="px-3 sm:px-4">
        <CardTitle>
          <Link href={`/product/${product.slug}`}>{product.name}</Link>
        </CardTitle>
      </CardHeader>
      <CardFooter className="mt-auto flex-col items-stretch gap-3 px-3 sm:px-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>{formatPrice(product.price)}</CardTitle>
          <Badge variant="secondary">{getStockLabel(product.stock)}</Badge>
        </div>
        <ProductCartButton
          productId={product.id}
          productName={product.name}
          disabled={product.stock <= 0}
          size="sm"
          fullWidth
        />
      </CardFooter>
    </Card>
  )
}
