import Link from "next/link"
import { redirect } from "next/navigation"
import { requireManager } from "@/lib/server-access"
import { buttonVariants } from "@/components/ui/button"
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let user
  try {
    user = await requireManager()
  } catch {
    redirect("/login?next=/admin")
  }
  return (
    <>
      <nav
        aria-label="Adminisztráció"
        className="mx-auto flex max-w-7xl flex-wrap gap-2 px-4 pt-6 sm:px-6"
      >
        <Link className={buttonVariants({ variant: "outline" })} href="/admin">
          Termékek és kategóriák
        </Link>
        <Link
          className={buttonVariants({ variant: "outline" })}
          href="/admin/orders"
        >
          Rendelések
        </Link>
        <Link
          className={buttonVariants({ variant: "outline" })}
          href="/admin/coupons"
        >
          Kuponok
        </Link>
        {user.role === "ADMIN" ? (
          <Link
            className={buttonVariants({ variant: "outline" })}
            href="/admin/users"
          >
            Felhasználók
          </Link>
        ) : null}
      </nav>
      {children}
    </>
  )
}
