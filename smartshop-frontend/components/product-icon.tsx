import {
  Backpack03Icon,
  Camera01Icon,
  HeadphonesIcon,
  KeyboardIcon,
  LampDeskIcon,
  PackageIcon,
  Watch01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

import { AspectRatio } from "@/components/ui/aspect-ratio"
import type { ProductIcon as ProductIconName } from "@/lib/products"
import { cn } from "@/lib/utils"

const icons = {
  headphones: HeadphonesIcon,
  watch: Watch01Icon,
  lamp: LampDeskIcon,
  keyboard: KeyboardIcon,
  backpack: Backpack03Icon,
  camera: Camera01Icon,
  package: PackageIcon,
}

export function ProductIcon({
  icon,
  ratio = 3 / 2,
  size = "default",
}: {
  icon: ProductIconName
  ratio?: number
  size?: "default" | "lg"
}) {
  return (
    <AspectRatio
      ratio={ratio}
      className="flex items-center justify-center"
      aria-hidden="true"
    >
      <HugeiconsIcon
        icon={icons[icon] ?? PackageIcon}
        strokeWidth={1.5}
        className={cn(size === "lg" ? "size-24" : "size-16")}
      />
    </AspectRatio>
  )
}
