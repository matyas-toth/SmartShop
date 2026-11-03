"use client"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { refreshCart } from "@/lib/cart-store"
export function SignOut() {
  const router = useRouter()
  return (
    <Button
      variant="outline"
      onClick={async () => {
        await authClient.signOut()
        await refreshCart()
        router.push("/")
        router.refresh()
      }}
    >
      Kijelentkezés
    </Button>
  )
}
