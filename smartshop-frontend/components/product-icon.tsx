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
import Image from "next/image"

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
  image,
  name = "",
  eager = false,
  ratio = 3 / 2,
  size = "default",
}: {
  icon: ProductIconName
  image?: string | null
  name?: string
  eager?: boolean
  ratio?: number
  size?: "default" | "lg"
}) {
  return (
    <AspectRatio
      ratio={ratio}
      className="flex items-center justify-center"
      aria-hidden={image ? undefined : true}
    >
      {image ? (
        <Image
          src={image}
          alt={name}
          fill
          loading={eager ? "eager" : "lazy"}
          unoptimized
          className="object-contain"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      ) : (
        <HugeiconsIcon
          icon={icons[icon] ?? PackageIcon}
          strokeWidth={1.5}
          className={cn(size === "lg" ? "size-24" : "size-16")}
        />
      )}
    </AspectRatio>
  )
}
