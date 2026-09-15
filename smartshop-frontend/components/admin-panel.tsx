"use client"

import * as React from "react"
import {
  ArrowLeft01Icon,
  Delete02Icon,
  DragDropVerticalIcon,
  Edit02Icon,
  FolderAddIcon,
  InformationCircleIcon,
  PackageAddIcon,
  PackageIcon,
  Store01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"

import { ThemeToggle } from "@/components/store-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import {
  addCategory,
  addProduct,
  deleteCategory,
  deleteProduct,
  moveProduct,
  updateCategory,
  updateProduct,
  useCatalog,
} from "@/lib/catalog-store"
import { formatPrice, type Category, type Product } from "@/lib/products"
import { cn } from "@/lib/utils"

function CategoryFormDialog({ category }: { category?: Category }) {
  const [open, setOpen] = React.useState(false)
  const inputId = category ? `category-${category.id}` : "new-category"

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const name = String(formData.get("name") ?? "").trim()

    if (!name) {
      return
    }

    if (category) {
      updateCategory(category.id, name)
      toast.add({
        title: "Kategória frissítve",
        description: name,
        type: "success",
      })
    } else {
      addCategory(name)
      toast.add({
        title: "Kategória létrehozva",
        description: name,
        type: "success",
      })
    }

    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant={category ? "ghost" : "outline"}
            size={category ? "icon-sm" : "sm"}
            aria-label={category ? `${category.name} szerkesztése` : undefined}
          />
        }
      >
        <HugeiconsIcon
          icon={category ? Edit02Icon : FolderAddIcon}
          strokeWidth={2}
          data-icon="inline-start"
        />
        {category ? (
          <span className="sr-only">Szerkesztés</span>
        ) : (
          "Új kategória"
        )}
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle>
              {category ? "Kategória szerkesztése" : "Új kategória"}
            </DialogTitle>
            <DialogDescription>
              A név automatikusan megjelenik a storefront navigációjában.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor={inputId}>Kategória neve</FieldLabel>
              <Input
                id={inputId}
                name="name"
                defaultValue={category?.name}
                placeholder="Például: Játék"
                required
                autoFocus
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Mégse
            </Button>
            <Button type="submit">Mentés</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function ProductFormDialog({
  categories,
  defaultCategoryId,
  product,
}: {
  categories: Category[]
  defaultCategoryId: string
  product?: Product
}) {
  const [open, setOpen] = React.useState(false)
  const idPrefix = product?.id ?? `new-${defaultCategoryId}`

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const input = {
      name: String(formData.get("name") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      categoryId: String(formData.get("categoryId") ?? defaultCategoryId),
      price: Number(formData.get("price")),
      stock: Number(formData.get("stock")),
    }

    if (!input.name || !input.description || !input.categoryId) {
      return
    }

    if (product) {
      updateProduct(product.id, input)
      toast.add({
        title: "Termék frissítve",
        description: input.name,
        type: "success",
      })
    } else {
      addProduct(input)
      toast.add({
        title: "Termék létrehozva",
        description: input.name,
        type: "success",
      })
    }

    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant={product ? "ghost" : "outline"}
            size={product ? "icon-sm" : "sm"}
            disabled={categories.length === 0}
            aria-label={product ? `${product.name} szerkesztése` : undefined}
          />
        }
      >
        <HugeiconsIcon
          icon={product ? Edit02Icon : PackageAddIcon}
          strokeWidth={2}
          data-icon="inline-start"
        />
        {product ? <span className="sr-only">Szerkesztés</span> : "Új termék"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <DialogHeader>
            <DialogTitle>
              {product ? "Termék szerkesztése" : "Új termék"}
            </DialogTitle>
            <DialogDescription>
              A mentett adatok azonnal megjelennek a storefronton.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor={`${idPrefix}-name`}>Terméknév</FieldLabel>
              <Input
                id={`${idPrefix}-name`}
                name="name"
                defaultValue={product?.name}
                placeholder="Termék neve"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor={`${idPrefix}-description`}>
                Leírás
              </FieldLabel>
              <Textarea
                id={`${idPrefix}-description`}
                name="description"
                defaultValue={product?.description}
                placeholder="Rövid, vásárlóbarát termékleírás"
                required
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field>
                <FieldLabel htmlFor={`${idPrefix}-price`}>Ár (Ft)</FieldLabel>
                <Input
                  id={`${idPrefix}-price`}
                  name="price"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={product?.price ?? 9990}
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor={`${idPrefix}-stock`}>Készlet</FieldLabel>
                <Input
                  id={`${idPrefix}-stock`}
                  name="stock"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={product?.stock ?? 10}
                  required
                />
              </Field>
            </div>
            <Field>
              <FieldLabel htmlFor={`${idPrefix}-category`}>
                Kategória
              </FieldLabel>
              <NativeSelect
                id={`${idPrefix}-category`}
                name="categoryId"
                defaultValue={product?.categoryId ?? defaultCategoryId}
                className="w-full"
                required
              >
                {categories.map((category) => (
                  <NativeSelectOption key={category.id} value={category.id}>
                    {category.name}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Mégse
            </Button>
            <Button type="submit">Mentés</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteProductDialog({ product }: { product: Product }) {
  const [open, setOpen] = React.useState(false)

  function handleDelete() {
    deleteProduct(product.id)
    setOpen(false)
    toast.add({
      title: "Termék törölve",
      description: product.name,
      type: "info",
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`${product.name} törlése`}
          />
        }
      >
        <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Biztosan törlöd?</AlertDialogTitle>
          <AlertDialogDescription>
            A(z) „{product.name}” eltűnik a storefrontból és a keresőből.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Mégse</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={handleDelete}>
            Törlés
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function DeleteCategoryDialog({
  category,
  hasProducts,
}: {
  category: Category
  hasProducts: boolean
}) {
  const [open, setOpen] = React.useState(false)

  function handleDelete() {
    if (!deleteCategory(category.id)) {
      toast.add({
        title: "A kategória nem törölhető",
        description: "Előbb töröld vagy mozgasd át a benne lévő termékeket.",
        type: "warning",
      })
      setOpen(false)
      return
    }

    toast.add({
      title: "Kategória törölve",
      description: category.name,
      type: "info",
    })
    setOpen(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`${category.name} törlése`}
          />
        }
      >
        <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {hasProducts ? "A kategória még nem üres" : "Biztosan törlöd?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {hasProducts
              ? "Mozgasd át vagy töröld a termékeket, mielőtt eltávolítod a kategóriát."
              : `A(z) „${category.name}” kategória eltűnik a navigációból.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Mégse</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={hasProducts}
            onClick={handleDelete}
          >
            Törlés
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function CategoryColumn({
  category,
  categories,
  products,
  allProducts,
}: {
  category: Category
  categories: Category[]
  products: Product[]
  allProducts: Product[]
}) {
  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault()
    const productId = event.dataTransfer.getData("text/plain")
    const product = allProducts.find((item) => item.id === productId)

    if (!product || product.categoryId === category.id) {
      return
    }

    moveProduct(productId, category.id)
    toast.add({
      title: "Termék áthelyezve",
      description: `${product.name} → ${category.name}`,
      type: "success",
    })
  }

  return (
    <Card
      onDragOver={(event) => event.preventDefault()}
      onDrop={handleDrop}
      className="min-h-80"
    >
      <CardHeader>
        <CardTitle>{category.name}</CardTitle>
        <CardDescription>{products.length} termék</CardDescription>
        <CardAction className="flex items-center gap-1">
          <CategoryFormDialog category={category} />
          <DeleteCategoryDialog
            category={category}
            hasProducts={products.length > 0}
          />
        </CardAction>
      </CardHeader>
      <CardContent className="flex-1">
        {products.length > 0 ? (
          <ItemGroup>
            {products.map((product) => (
              <Item
                key={product.id}
                variant="outline"
                draggable
                onDragStart={(event) => {
                  event.dataTransfer.effectAllowed = "move"
                  event.dataTransfer.setData("text/plain", product.id)
                }}
              >
                <ItemMedia variant="icon">
                  <HugeiconsIcon
                    icon={DragDropVerticalIcon}
                    strokeWidth={1.5}
                  />
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>{product.name}</ItemTitle>
                  <ItemDescription className="tabular-nums">
                    {formatPrice(product.price)} · {product.stock} db
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <ProductFormDialog
                    product={product}
                    categories={categories}
                    defaultCategoryId={category.id}
                  />
                  <DeleteProductDialog product={product} />
                </ItemActions>
                <ItemFooter>
                  <Badge variant="outline">Áthúzható</Badge>
                  <Badge
                    variant={product.stock > 0 ? "secondary" : "destructive"}
                  >
                    {product.stock > 0 ? "Aktív" : "Elfogyott"}
                  </Badge>
                </ItemFooter>
              </Item>
            ))}
          </ItemGroup>
        ) : (
          <Empty className="min-h-44">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={PackageIcon} strokeWidth={1.5} />
              </EmptyMedia>
              <EmptyTitle>Üres kategória</EmptyTitle>
              <EmptyDescription>
                Húzz ide egy terméket, vagy hozz létre újat.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
      <CardFooter>
        <ProductFormDialog
          categories={categories}
          defaultCategoryId={category.id}
        />
      </CardFooter>
    </Card>
  )
}

export function AdminPanel() {
  const catalog = useCatalog()
  const totalStock = catalog.products.reduce(
    (sum, product) => sum + product.stock,
    0
  )

  return (
    <div className="min-h-svh">
      <header>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Item size="xs" className="w-auto">
            <ItemMedia variant="icon">
              <HugeiconsIcon icon={Store01Icon} strokeWidth={2} />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>SmartShop Admin</ItemTitle>
              <ItemDescription className="hidden sm:flex">
                LocalStorage katalóguskezelő
              </ItemDescription>
            </ItemContent>
          </Item>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
            >
              <HugeiconsIcon
                icon={ArrowLeft01Icon}
                strokeWidth={2}
                data-icon="inline-start"
              />
              <span className="hidden sm:inline">Storefront</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
        <Separator />
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <Item className="w-auto" size="sm">
            <ItemContent>
              <ItemTitle>Katalóguskezelés</ItemTitle>
              <ItemDescription>
                Kategóriák, termékek és készlet egyetlen nézetben.
              </ItemDescription>
            </ItemContent>
          </Item>
          <CategoryFormDialog />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card size="sm">
            <CardHeader>
              <CardDescription>Kategóriák</CardDescription>
              <CardTitle className="tabular-nums">
                {catalog.categories.length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardDescription>Termékek</CardDescription>
              <CardTitle className="tabular-nums">
                {catalog.products.length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardDescription>Teljes készlet</CardDescription>
              <CardTitle className="tabular-nums">{totalStock} db</CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Alert>
          <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} />
          <AlertTitle>Mock admin · autentikáció nélkül</AlertTitle>
          <AlertDescription>
            Húzd a termékkártyákat másik kategóriába, vagy a szerkesztőben
            válassz új kategóriát. Minden változás csak ebben a böngészőben
            tárolódik.
          </AlertDescription>
        </Alert>

        {catalog.categories.length > 0 ? (
          <div className="grid items-start gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {catalog.categories.map((category) => (
              <CategoryColumn
                key={category.id}
                category={category}
                categories={catalog.categories}
                allProducts={catalog.products}
                products={catalog.products.filter(
                  (product) => product.categoryId === category.id
                )}
              />
            ))}
          </div>
        ) : (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={FolderAddIcon} strokeWidth={1.5} />
              </EmptyMedia>
              <EmptyTitle>Még nincs kategória</EmptyTitle>
              <EmptyDescription>
                Hozd létre az első kategóriát a termékek rendezéséhez.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </main>
    </div>
  )
}
