"use client"

import { Delete02Icon, ShoppingBagAddIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { Button, ButtonStateIcon } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { addToCart, removeFromCart, useCart } from "@/lib/cart-store"
import { cn } from "@/lib/utils"

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
  const quantity =
    cart.find((item) => item.productId === productId)?.quantity ?? 0
  const isInCart = quantity > 0

  function handleCartAction() {
    if (isInCart) {
      removeFromCart(productId)
      toast.add({
        title: "Eltávolítva a kosárból",
        description: productName,
        type: "info",
      })
      return
    }

    addToCart(productId)
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
      disabled={disabled}
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
