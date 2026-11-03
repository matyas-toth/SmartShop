import Link from "next/link"
import { Empty, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { buttonVariants } from "@/components/ui/button"
export default function NotFound() {
  return (
    <main className="mx-auto max-w-4xl p-8">
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Ez az oldal nem található</EmptyTitle>
        </EmptyHeader>
        <Link href="/" className={buttonVariants()}>
          Vissza a boltba
        </Link>
      </Empty>
    </main>
  )
}
