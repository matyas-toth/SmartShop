"use client"
import { HugeiconsIcon } from "@hugeicons/react"
import { DeliveryTruck02Icon } from "@hugeicons/core-free-icons"
import { Progress, ProgressLabel } from "@/components/ui/progress"
import { formatPrice } from "@/lib/products"
import { shippingProgress } from "@/lib/shipping"
export function ShippingProgress({ amount }: { amount: number }) {
  const { percent, remaining } = shippingProgress(amount)
  const label = remaining
    ? `Még ${formatPrice(remaining)} az ingyenes szállításig`
    : "A szállítás ingyenes"
  return (
    <Progress
      value={percent}
      aria-label="Ingyenes szállítás"
      aria-valuetext={label}
      marker={<HugeiconsIcon icon={DeliveryTruck02Icon} strokeWidth={1.7} />}
    >
      <ProgressLabel className="tabular-nums" aria-live="polite">
        {label}
      </ProgressLabel>
    </Progress>
  )
}
