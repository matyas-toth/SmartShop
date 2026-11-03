export const FREE_SHIPPING_THRESHOLD = 30000
export const SHIPPING_FEE = 1490
export function shippingProgress(amount: number) {
  const eligible = Number.isFinite(amount) ? Math.max(0, amount) : 0
  return {
    remaining: Math.max(0, FREE_SHIPPING_THRESHOLD - eligible),
    percent: Math.min(100, (eligible / FREE_SHIPPING_THRESHOLD) * 100),
  }
}
