"use client"

import { useSyncExternalStore } from "react"

export type CartItem = {
  productId: string
  quantity: number
}

type StoredCart = {
  version: 1
  items: CartItem[]
}

const STORAGE_KEY = "smartshop.cart.v1"
const CART_EVENT = "smartshop:cart-change"
const EMPTY_CART: CartItem[] = []

let cachedCart: CartItem[] | undefined

function parseCart(value: string | null): CartItem[] {
  if (!value) {
    return EMPTY_CART
  }

  try {
    const stored = JSON.parse(value) as Partial<StoredCart>

    if (stored.version !== 1 || !Array.isArray(stored.items)) {
      return EMPTY_CART
    }

    return stored.items.filter(
      (item): item is CartItem =>
        typeof item?.productId === "string" &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0 &&
        item.quantity <= 99
    )
  } catch {
    return EMPTY_CART
  }
}

function getCartSnapshot(): CartItem[] {
  if (typeof window === "undefined") {
    return EMPTY_CART
  }

  cachedCart ??= parseCart(window.localStorage.getItem(STORAGE_KEY))
  return cachedCart
}

function getServerSnapshot(): CartItem[] {
  return EMPTY_CART
}

function subscribe(onStoreChange: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key !== STORAGE_KEY) {
      return
    }

    cachedCart = parseCart(event.newValue)
    onStoreChange()
  }

  window.addEventListener("storage", handleStorage)
  window.addEventListener(CART_EVENT, onStoreChange)

  return () => {
    window.removeEventListener("storage", handleStorage)
    window.removeEventListener(CART_EVENT, onStoreChange)
  }
}

function saveCart(items: CartItem[]) {
  cachedCart = items

  const storedCart: StoredCart = {
    version: 1,
    items,
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storedCart))
  } catch {
    // The in-memory cart still works if browser storage is unavailable.
  }

  window.dispatchEvent(new Event(CART_EVENT))
}

export function addToCart(productId: string) {
  const items = getCartSnapshot()
  const existingItem = items.find((item) => item.productId === productId)

  if (!existingItem) {
    saveCart([...items, { productId, quantity: 1 }])
    return
  }

  saveCart(
    items.map((item) =>
      item.productId === productId
        ? { ...item, quantity: Math.min(item.quantity + 1, 99) }
        : item
    )
  )
}

export function updateCartQuantity(productId: string, quantity: number) {
  if (quantity <= 0) {
    saveCart(getCartSnapshot().filter((item) => item.productId !== productId))
    return
  }

  saveCart(
    getCartSnapshot().map((item) =>
      item.productId === productId
        ? { ...item, quantity: Math.min(quantity, 99) }
        : item
    )
  )
}

export function removeFromCart(productId: string) {
  saveCart(getCartSnapshot().filter((item) => item.productId !== productId))
}

export function useCart() {
  return useSyncExternalStore(subscribe, getCartSnapshot, getServerSnapshot)
}
