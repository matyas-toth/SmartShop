"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"
import { StoreHeader } from "@/components/store-header"
import { Separator } from "@/components/ui/separator"
import { buttonVariants } from "@/components/ui/button"
import { useCatalog, refreshCatalog } from "@/lib/catalog-store"
export function ShopShell({ children }: { children: React.ReactNode }) {
  const catalog = useCatalog()
  const pathname = usePathname()
  const previous = useRef(pathname)
  useEffect(() => {
    if (previous.current !== pathname) {
      previous.current = pathname
      void refreshCatalog().catch(() => {})
    }
  }, [pathname])
  return (
    <div className="flex min-h-svh flex-col">
      <StoreHeader />
      <div className="flex-1">{children}</div>
      <footer className="mt-12">
        <Separator />
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-3 sm:px-6">
          <div className="flex flex-col items-start gap-2">
            <Link className={buttonVariants({ variant: "ghost" })} href="/">
              SmartShop
            </Link>
            <Link className={buttonVariants({ variant: "link" })} href="/help">
              Szállítás és fizetés
            </Link>
          </div>
          <nav
            aria-label="Kategóriák a láblécben"
            className="flex flex-wrap items-start gap-2"
          >
            {catalog.categories.map((c) => (
              <Link
                key={c.id}
                className={buttonVariants({ variant: "ghost", size: "sm" })}
                href={`/category/${c.slug}`}
              >
                {c.name}
              </Link>
            ))}
          </nav>
          <nav
            aria-label="Fiók a láblécben"
            className="flex flex-wrap items-start gap-2"
          >
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/account"
            >
              Fiókom és rendeléseim
            </Link>
            <Link
              className={buttonVariants({ variant: "outline" })}
              href="/cart"
            >
              Kosár
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
