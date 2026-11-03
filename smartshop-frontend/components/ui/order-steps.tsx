"use client"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CreditCardIcon,
  PackageIcon,
  DeliveryTruck02Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons"
import { Badge } from "@/components/ui/badge"
import { Item, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"
const steps = [
  { status: "PAID", label: "Fizetve", icon: CreditCardIcon },
  { status: "PROCESSING", label: "Összekészítés", icon: PackageIcon },
  { status: "SHIPPED", label: "Feladva", icon: DeliveryTruck02Icon },
  { status: "DELIVERED", label: "Kézbesítve", icon: Tick02Icon },
]
export function OrderSteps({ status }: { status: string }) {
  const current = steps.findIndex((step) => step.status === status)
  return (
    <ItemGroup
      aria-label="Rendelés állomásai"
      className="grid gap-2 sm:grid-cols-4"
    >
      {steps.map((step, index) => (
        <Item
          role="listitem"
          key={step.status}
          variant={index === current ? "muted" : "default"}
          aria-current={index === current ? "step" : undefined}
          data-state={
            index < current
              ? "complete"
              : index === current
                ? "current"
                : "upcoming"
          }
          className="min-w-0 flex-nowrap gap-3 px-2 sm:flex-col sm:items-center sm:gap-2 sm:py-3"
        >
          <ItemMedia>
            <Badge
              variant={index <= current ? "default" : "outline"}
              className="size-9 justify-center rounded-full p-0 transition-[background-color,color] duration-300 motion-reduce:transition-none"
              aria-hidden="true"
            >
              <HugeiconsIcon
                icon={index < current ? Tick02Icon : step.icon}
                strokeWidth={1.7}
                className="size-4"
              />
            </Badge>
          </ItemMedia>
          <ItemTitle className="line-clamp-none sm:justify-center">
            {step.label}
          </ItemTitle>
        </Item>
      ))}
    </ItemGroup>
  )
}
