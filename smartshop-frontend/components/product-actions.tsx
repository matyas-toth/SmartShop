"use client"

import { Delete02Icon, ShoppingBagAddIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Button, ButtonStateIcon } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { addToCart, removeFromCart, useCart } from "@/lib/cart-store"
import { cn } from "@/lib/utils"
import { useState } from "react"

export function ProductCartButton({
  productId,
  productName,
  disabled = false,
  fullWidth = false,
  size = "default",
}: {
  productId: string
  productName: string
  disabled?: boolean
  fullWidth?: boolean
  size?: "sm" | "default" | "lg"
}) {
  const cart = useCart()
  const [pending, setPending] = useState(false)
  const quantity =
    cart.find((item) => item.productId === productId)?.quantity ?? 0
  const isInCart = quantity > 0

  async function handleCartAction() {
    setPending(true)
    if (isInCart) {
      const ok = await removeFromCart(productId)
      setPending(false)
      if (!ok) return
      toast.add({
        title: "Eltávolítva a kosárból",
        description: productName,
        type: "info",
      })
      return
    }

    const ok = await addToCart(productId)
    setPending(false)
    if (!ok) return
    toast.add({
      title: "Kosárba került",
      description: productName,
      type: "success",
    })
  }

  return (
    <Button
      variant={isInCart ? "secondary" : "default"}
      size={size}
      disabled={pending || (disabled && !isInCart)}
      className={cn("min-w-28", fullWidth && "w-full")}
      onClick={handleCartAction}
      aria-label={
        isInCart
          ? `${productName} eltávolítása a kosárból`
          : `${productName} kosárba helyezése`
      }
    >
      <ButtonStateIcon
        active={isInCart}
        activeIcon={<HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />}
        inactiveIcon={
          <HugeiconsIcon icon={ShoppingBagAddIcon} strokeWidth={2} />
        }
      />
      <span aria-live="polite">{isInCart ? "Eltávolítás" : "Kosárba"}</span>
    </Button>
  )
}
