"use client"
import { useSyncExternalStore } from "react"
import { type Catalog, type Product } from "@/lib/products"
import { toast } from "@/components/ui/toast"
export type ProductInput = Pick<
  Product,
  "name" | "description" | "categoryId" | "price" | "stock"
>
const empty: Catalog = { version: 1, categories: [], products: [] }
let catalog = empty
let started = false
let ready = false
const listeners = new Set<() => void>()
export async function refreshCatalog() {
  const response = await fetch(
    window.location.pathname.startsWith("/admin")
      ? "/api/catalog?admin=1"
      : "/api/catalog"
  )
  if (!response.ok) throw new Error("A katalógus nem tölthető be.")
  catalog = await response.json()
  ready = true
  listeners.forEach((listener) => listener())
}
async function mutate(action: string, id?: string, data?: unknown) {
  const response = await fetch("/api/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, id, data }),
  })
  const result = await response.json()
  if (!response.ok) {
    toast.add({ title: result.error, type: "error" })
    throw new Error(result.error)
  }
  await refreshCatalog()
  return true
}
export const addCategory = (name: string) =>
  mutate("category.create", undefined, { name })
export const updateCategory = (id: string, name: string) =>
  mutate("category.update", id, { name })
export const deleteCategory = (id: string) => mutate("category.delete", id)
export const addProduct = (data: ProductInput) =>
  mutate("product.create", undefined, data)
export const updateProduct = (id: string, data: ProductInput) =>
  mutate("product.update", id, data)
export const deleteProduct = (id: string) => mutate("product.delete", id)
export const moveProduct = (id: string, categoryId: string) =>
  mutate("product.move", id, { categoryId })
function subscribe(listener: () => void) {
  listeners.add(listener)
  if (!started) {
    started = true
    void refreshCatalog().catch(() =>
      toast.add({ title: "A katalógus nem tölthető be.", type: "error" })
    )
  }
  return () => {
    listeners.delete(listener)
  }
}
export function useCatalog() {
  return useSyncExternalStore(
    subscribe,
    () => catalog,
    () => empty
  )
}
export function useCatalogReady() {
  return useSyncExternalStore(
    subscribe,
    () => ready,
    () => false
  )
}
