export type ProductIcon =
  | "headphones"
  | "watch"
  | "lamp"
  | "keyboard"
  | "backpack"
  | "camera"
  | "package"

export type Category = {
  id: string
  name: string
  slug: string
}

export type Product = {
  id: string
  slug: string
  name: string
  description: string
  categoryId: string
  price: number
  stock: number
  icon: ProductIcon
  image?: string | null
}

export type Catalog = {
  version: 1
  categories: Category[]
  products: Product[]
}

export const defaultCatalog: Catalog = {
  version: 1,
  categories: [
    { id: "audio", name: "Audio", slug: "audio" },
    { id: "wearables", name: "Viselhető", slug: "viselheto" },
    { id: "home", name: "Otthon", slug: "otthon" },
    { id: "office", name: "Iroda", slug: "iroda" },
    { id: "accessories", name: "Kiegészítő", slug: "kiegeszito" },
    { id: "photo", name: "Fotó", slug: "foto" },
  ],
  products: [
    {
      id: "wave-headphones",
      slug: "wave-vezetek-nelkuli-fejhallgato",
      name: "Wave vezeték nélküli fejhallgató",
      description:
        "Kényelmes kialakítás, tiszta hangzás és egész napos üzemidő.",
      categoryId: "audio",
      price: 34990,
      stock: 12,
      icon: "headphones",
    },
    {
      id: "pulse-watch",
      slug: "pulse-okosora",
      name: "Pulse okosóra",
      description: "Aktivitáskövetés és értesítések letisztult, könnyű házban.",
      categoryId: "wearables",
      price: 44990,
      stock: 8,
      icon: "watch",
    },
    {
      id: "halo-lamp",
      slug: "halo-asztali-lampa",
      name: "Halo asztali lámpa",
      description:
        "Állítható fényerő az esti olvasáshoz és a fókuszált munkához.",
      categoryId: "home",
      price: 18990,
      stock: 3,
      icon: "lamp",
    },
    {
      id: "type-mini-keyboard",
      slug: "type-mini-billentyuzet",
      name: "Type Mini billentyűzet",
      description:
        "Kompakt, vezeték nélküli billentyűzet halk, pontos gépeléshez.",
      categoryId: "office",
      price: 24990,
      stock: 15,
      icon: "keyboard",
    },
    {
      id: "roam-backpack",
      slug: "roam-varosi-hatizsak",
      name: "Roam városi hátizsák",
      description:
        "Rendezett belső tér és párnázott rekesz a mindennapi eszközökhöz.",
      categoryId: "accessories",
      price: 21990,
      stock: 9,
      icon: "backpack",
    },
    {
      id: "snap-camera",
      slug: "snap-instant-kamera",
      name: "Snap instant kamera",
      description:
        "Egyszerű kezelés és azonnal kézbe vehető analóg pillanatok.",
      categoryId: "photo",
      price: 39990,
      stock: 4,
      icon: "camera",
    },
  ],
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export function getStockLabel(stock: number) {
  if (stock <= 0) {
    return "Elfogyott"
  }

  if (stock <= 5) {
    return "Utolsó darabok"
  }

  return "Raktáron"
}

const currencyFormatter = new Intl.NumberFormat("hu-HU", {
  style: "currency",
  currency: "HUF",
  maximumFractionDigits: 0,
})

export function formatPrice(value: number) {
  return currencyFormatter.format(value)
}
