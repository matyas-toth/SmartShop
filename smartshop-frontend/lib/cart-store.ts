"use client"
import { useSyncExternalStore } from "react"
import { toast } from "@/components/ui/toast"
export type CartItem = { productId: string; quantity: number }
const empty: CartItem[] = []
let items = empty
let ready = false
let started = false
let queue: Promise<unknown> = Promise.resolve()
const listeners = new Set<() => void>()
function emit() {
  listeners.forEach((listener) => listener())
}
export async function refreshCart() {
  const response = await fetch("/api/cart", { cache: "no-store" })
  if (!response.ok) throw new Error("A kosár nem tölthető be.")
  items = await response.json()
  ready = true
  emit()
}
function mutate(
  productId: string,
  quantity: number | ((current: number) => number)
) {
  const operation = queue.then(async () => {
    if (!ready) await refreshCart()
    const current = items.find((i) => i.productId === productId)?.quantity ?? 0
    const value = typeof quantity === "function" ? quantity(current) : quantity
    const response = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        quantity: Math.min(99, Math.max(0, value)),
      }),
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error)
    items = result
    emit()
    return true
  })
  queue = operation.catch(() => {})
  return operation.catch((e) => {
    toast.add({ title: e.message ?? "A kosár nem menthető.", type: "error" })
    return false
  })
}
export const addToCart = (id: string) => mutate(id, (current) => current + 1)
export const updateCartQuantity = (id: string, quantity: number) =>
  mutate(id, quantity)
export const removeFromCart = (id: string) => mutate(id, 0)
function subscribe(listener: () => void) {
  listeners.add(listener)
  if (!started) {
    started = true
    void refreshCart().catch(() =>
      toast.add({ title: "A kosár nem tölthető be.", type: "error" })
    )
  }
  return () => {
    listeners.delete(listener)
  }
}
export function useCart() {
  return useSyncExternalStore(
    subscribe,
    () => items,
    () => empty
  )
}
export function useCartReady() {
  return useSyncExternalStore(
    subscribe,
    () => ready,
    () => false
  )
}
