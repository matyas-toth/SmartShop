"use client"

import { useSyncExternalStore } from "react"

import {
  defaultCatalog,
  slugify,
  type Catalog,
  type Category,
  type Product,
} from "@/lib/products"

export type ProductInput = Pick<
  Product,
  "name" | "description" | "categoryId" | "price" | "stock"
>

const STORAGE_KEY = "smartshop.catalog.v1"
const CATALOG_EVENT = "smartshop:catalog-change"

let cachedCatalog: Catalog | undefined

function isCategory(value: unknown): value is Category {
  if (!value || typeof value !== "object") {
    return false
  }

  const category = value as Partial<Category>
  return (
    typeof category.id === "string" &&
    typeof category.name === "string" &&
    typeof category.slug === "string"
  )
}

function isProduct(value: unknown): value is Product {
  if (!value || typeof value !== "object") {
    return false
  }

  const product = value as Partial<Product>
  return (
    typeof product.id === "string" &&
    typeof product.slug === "string" &&
    typeof product.name === "string" &&
    typeof product.description === "string" &&
    typeof product.categoryId === "string" &&
    typeof product.price === "number" &&
    Number.isFinite(product.price) &&
    typeof product.stock === "number" &&
    Number.isFinite(product.stock) &&
    typeof product.icon === "string"
  )
}

function parseCatalog(value: string | null): Catalog {
  if (!value) {
    return defaultCatalog
  }

  try {
    const stored = JSON.parse(value) as Partial<Catalog>

    if (
      stored.version !== 1 ||
      !Array.isArray(stored.categories) ||
      !stored.categories.every(isCategory) ||
      !Array.isArray(stored.products) ||
      !stored.products.every(isProduct)
    ) {
      return defaultCatalog
    }

    return stored as Catalog
  } catch {
    return defaultCatalog
  }
}

function getCatalogSnapshot(): Catalog {
  if (typeof window === "undefined") {
    return defaultCatalog
  }

  cachedCatalog ??= parseCatalog(window.localStorage.getItem(STORAGE_KEY))
  return cachedCatalog
}

function getServerSnapshot(): Catalog {
  return defaultCatalog
}

function subscribe(onStoreChange: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key !== STORAGE_KEY) {
      return
    }

    cachedCatalog = parseCatalog(event.newValue)
    onStoreChange()
  }

  window.addEventListener("storage", handleStorage)
  window.addEventListener(CATALOG_EVENT, onStoreChange)

  return () => {
    window.removeEventListener("storage", handleStorage)
    window.removeEventListener(CATALOG_EVENT, onStoreChange)
  }
}

function saveCatalog(catalog: Catalog) {
  cachedCatalog = catalog

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(catalog))
  } catch {
    // The in-memory catalog remains usable when browser storage is unavailable.
  }

  window.dispatchEvent(new Event(CATALOG_EVENT))
}

function createUniqueSlug(value: string, existingSlugs: string[]) {
  const base = slugify(value) || "uj-elem"
  const occupied = new Set(existingSlugs)

  if (!occupied.has(base)) {
    return base
  }

  let suffix = 2
  while (occupied.has(`${base}-${suffix}`)) {
    suffix += 1
  }

  return `${base}-${suffix}`
}

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`
}

export function addCategory(name: string) {
  const catalog = getCatalogSnapshot()
  const trimmedName = name.trim()
  const category: Category = {
    id: createId("category"),
    name: trimmedName,
    slug: createUniqueSlug(
      trimmedName,
      catalog.categories.map((item) => item.slug)
    ),
  }

  saveCatalog({
    ...catalog,
    categories: [...catalog.categories, category],
  })
  return category
}

export function updateCategory(categoryId: string, name: string) {
  const catalog = getCatalogSnapshot()
  const trimmedName = name.trim()

  saveCatalog({
    ...catalog,
    categories: catalog.categories.map((category) =>
      category.id === categoryId
        ? {
            ...category,
            name: trimmedName,
            slug: createUniqueSlug(
              trimmedName,
              catalog.categories
                .filter((item) => item.id !== categoryId)
                .map((item) => item.slug)
            ),
          }
        : category
    ),
  })
}

export function deleteCategory(categoryId: string) {
  const catalog = getCatalogSnapshot()

  if (catalog.products.some((product) => product.categoryId === categoryId)) {
    return false
  }

  saveCatalog({
    ...catalog,
    categories: catalog.categories.filter(
      (category) => category.id !== categoryId
    ),
  })
  return true
}

export function addProduct(input: ProductInput) {
  const catalog = getCatalogSnapshot()
  const product: Product = {
    ...input,
    id: createId("product"),
    slug: createUniqueSlug(
      input.name,
      catalog.products.map((item) => item.slug)
    ),
    icon: "package",
  }

  saveCatalog({
    ...catalog,
    products: [...catalog.products, product],
  })
  return product
}

export function updateProduct(productId: string, input: ProductInput) {
  const catalog = getCatalogSnapshot()

  saveCatalog({
    ...catalog,
    products: catalog.products.map((product) =>
      product.id === productId
        ? {
            ...product,
            ...input,
            slug: createUniqueSlug(
              input.name,
              catalog.products
                .filter((item) => item.id !== productId)
                .map((item) => item.slug)
            ),
          }
        : product
    ),
  })
}

export function moveProduct(productId: string, categoryId: string) {
  const catalog = getCatalogSnapshot()

  saveCatalog({
    ...catalog,
    products: catalog.products.map((product) =>
      product.id === productId ? { ...product, categoryId } : product
    ),
  })
}

export function deleteProduct(productId: string) {
  const catalog = getCatalogSnapshot()
  saveCatalog({
    ...catalog,
    products: catalog.products.filter((product) => product.id !== productId),
  })
}

export function useCatalog() {
  return useSyncExternalStore(subscribe, getCatalogSnapshot, getServerSnapshot)
}
