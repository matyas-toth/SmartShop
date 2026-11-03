"use client"

import * as React from "react"
import {
  Add01Icon,
  Delete02Icon,
  MinusSignIcon,
  Moon02Icon,
  Search01Icon,
  ShoppingBasket01Icon,
  Store01Icon,
  Sun03Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { authClient } from "@/lib/auth-client"

import { Badge } from "@/components/ui/badge"
import { Button, ButtonStateIcon, buttonVariants } from "@/components/ui/button"
import { ButtonGroup, ButtonGroupText } from "@/components/ui/button-group"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
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
  ItemFooter,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Kbd } from "@/components/ui/kbd"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { removeFromCart, updateCartQuantity, useCart } from "@/lib/cart-store"
import { useCatalog } from "@/lib/catalog-store"
import { formatPrice } from "@/lib/products"

const subscribeHydration = () => () => {}
export function ThemeToggle() {
  const mounted = React.useSyncExternalStore(
    subscribeHydration,
    () => true,
    () => false
  )
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = mounted && resolvedTheme === "dark"

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Színtéma váltása"
            onClick={() => setTheme(isDark ? "light" : "dark")}
          />
        }
      >
        <ButtonStateIcon
          active={isDark}
          activeIcon={<HugeiconsIcon icon={Moon02Icon} strokeWidth={2} />}
          inactiveIcon={<HugeiconsIcon icon={Sun03Icon} strokeWidth={2} />}
        />
      </TooltipTrigger>
      <TooltipContent>Téma váltása</TooltipContent>
    </Tooltip>
  )
}

function ProductSearch() {
  const [open, setOpen] = React.useState(false)
  const catalog = useCatalog()
  const router = useRouter()

  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (
        !event.isComposing &&
        typeof event.key === "string" &&
        (event.ctrlKey || event.metaKey) &&
        event.key.toLowerCase() === "k"
      ) {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  function openProduct(slug: string) {
    setOpen(false)
    router.push(`/product/${slug}`)
  }

  return (
    <>
      <Button
        aria-label="Keresés"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <HugeiconsIcon
          icon={Search01Icon}
          strokeWidth={2}
          data-icon="inline-start"
        />
        <span className="hidden sm:inline">Keresés</span>
        <Kbd className="hidden lg:inline-flex">Ctrl K</Kbd>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Termékkereső"
        description="Keress a SmartShop teljes kínálatában."
      >
        <Command>
          <CommandInput placeholder="Termék vagy kategória keresése..." />
          <CommandList>
            <CommandEmpty>Nincs találat.</CommandEmpty>
            {catalog.categories.map((category) => {
              const categoryProducts = catalog.products.filter(
                (product) => product.categoryId === category.id
              )

              return categoryProducts.length > 0 ? (
                <CommandGroup key={category.id} heading={category.name}>
                  {categoryProducts.map((product) => (
                    <CommandItem
                      key={product.id}
                      value={`${product.name} ${category.name}`}
                      onSelect={() => openProduct(product.slug)}
                    >
                      <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="truncate">{product.name}</span>
                        <span className="tabular-nums">
                          {formatPrice(product.price)}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : null
            })}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}

function CartSheet() {
  const cart = useCart()
  const catalog = useCatalog()
  const productMap = new Map(
    catalog.products.map((product) => [product.id, product])
  )
  const detailedItems = cart.flatMap((item) => {
    const product = productMap.get(item.productId)
    return product ? [{ ...item, product }] : []
  })
  const itemCount = detailedItems.reduce(
    (total, item) => total + item.quantity,
    0
  )
  const total = detailedItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )

  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" size="sm" />}>
        <HugeiconsIcon
          icon={ShoppingBasket01Icon}
          strokeWidth={2}
          data-icon="inline-start"
        />
        <span className="hidden sm:inline">Kosár</span>
        <Badge variant="secondary">{itemCount}</Badge>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Kosár</SheetTitle>
          <SheetDescription>
            {itemCount > 0 ? `${itemCount} termék` : "Üres kosár"}
          </SheetDescription>
        </SheetHeader>

        {detailedItems.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HugeiconsIcon icon={ShoppingBasket01Icon} strokeWidth={1.5} />
              </EmptyMedia>
              <EmptyTitle>Még nincs itt semmi</EmptyTitle>
              <EmptyDescription>
                Válassz egy terméket a kínálatból, és tedd a kosaradba.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ScrollArea className="min-h-0 flex-1 px-6">
            <ItemGroup>
              {detailedItems.map(({ product, quantity }) => (
                <Item key={product.id} variant="outline">
                  <ItemContent>
                    <ItemTitle>{product.name}</ItemTitle>
                    <ItemDescription>
                      {formatPrice(product.price)} / db
                    </ItemDescription>
                  </ItemContent>
                  <ItemActions>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`${product.name} eltávolítása`}
                      onClick={() => removeFromCart(product.id)}
                    >
                      <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                    </Button>
                  </ItemActions>
                  <ItemFooter>
                    <ButtonGroup aria-label={`${product.name} mennyisége`}>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        aria-label="Mennyiség csökkentése"
                        onClick={() =>
                          updateCartQuantity(product.id, quantity - 1)
                        }
                      >
                        <HugeiconsIcon icon={MinusSignIcon} strokeWidth={2} />
                      </Button>
                      <ButtonGroupText className="tabular-nums">
                        {quantity} db
                      </ButtonGroupText>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        aria-label="Mennyiség növelése"
                        disabled={quantity >= 99}
                        onClick={() =>
                          updateCartQuantity(product.id, quantity + 1)
                        }
                      >
                        <HugeiconsIcon icon={Add01Icon} strokeWidth={2} />
                      </Button>
                    </ButtonGroup>
                    <ItemTitle className="tabular-nums">
                      {formatPrice(product.price * quantity)}
                    </ItemTitle>
                  </ItemFooter>
                </Item>
              ))}
            </ItemGroup>
          </ScrollArea>
        )}

        <SheetFooter>
          <Link href="/cart" className={buttonVariants()}>
            Kosár megtekintése
          </Link>
          {itemCount > 0 ? (
            <Link
              href="/checkout"
              className={buttonVariants({ variant: "outline" })}
            >
              Megrendelés
            </Link>
          ) : null}
          <Separator />
          <Item size="sm">
            <ItemContent>
              <ItemDescription>Termékek összesen</ItemDescription>
              <ItemTitle className="tabular-nums">
                {formatPrice(total)}
              </ItemTitle>
            </ItemContent>
            <ItemActions>
              <Badge variant={itemCount > 0 ? "default" : "secondary"}>
                {itemCount} db
              </Badge>
            </ItemActions>
          </Item>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export function StoreHeader() {
  const catalog = useCatalog()
  const { data: session } = authClient.useSession()
  const role = (session?.user as { role?: string } | undefined)?.role

  return (
    <header>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <Item
          size="xs"
          className="w-auto shrink-0"
          render={<Link href="/" aria-label="SmartShop főoldal" />}
        >
          <ItemMedia variant="icon" className="hidden sm:flex">
            <HugeiconsIcon icon={Store01Icon} strokeWidth={2} />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>SmartShop</ItemTitle>
          </ItemContent>
        </Item>
        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/account"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            Fiókom
          </Link>
          <ProductSearch />
          <ThemeToggle />
          <CartSheet />
        </div>
      </div>
      <Separator />
      <div className="mx-auto max-w-7xl overflow-x-auto px-4 sm:px-6 lg:px-8">
        <NavigationMenu className="max-w-none justify-start">
          <NavigationMenuList className="justify-start">
            {catalog.categories.map((category) => (
              <NavigationMenuItem key={category.id}>
                <NavigationMenuLink
                  render={<Link href={`/category/${category.slug}`} />}
                >
                  {category.name}
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
            {role && role !== "CUSTOMER" ? (
              <NavigationMenuItem>
                <NavigationMenuLink render={<Link href="/admin" />}>
                  Admin
                </NavigationMenuLink>
              </NavigationMenuItem>
            ) : null}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
      <Separator />
    </header>
  )
}
