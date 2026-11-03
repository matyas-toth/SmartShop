"use client"
import { useState } from "react"
import { ProductIcon } from "@/components/product-icon"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { refreshCatalog } from "@/lib/catalog-store"
import type { Product } from "@/lib/products"

export function ProductImageUpload({ product }: { product: Product }) {
  const [image, setImage] = useState(product.image)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState("")
  const [status, setStatus] = useState("")
  const endpoint = `/api/products/${encodeURIComponent(product.id)}/image`
  async function save(file?: File) {
    setError("")
    setStatus("")
    if (file && file.size > 5 * 1024 * 1024) {
      setError("A kép legfeljebb 5 MB lehet.")
      return
    }
    setPending(true)
    try {
      const response = await fetch(endpoint, {
        method: file ? "PUT" : "DELETE",
        body: file,
        headers: file
          ? { "Content-Type": file.type || "application/octet-stream" }
          : undefined,
      })
      const result = response.status === 204 ? {} : await response.json()
      if (!response.ok)
        throw new Error(result.error || "A kép mentése nem sikerült.")
      setImage(result.image ?? null)
      setStatus(file ? "A kép feltöltve." : "A kép törölve.")
      await refreshCatalog()
    } catch (e) {
      setError(e instanceof Error ? e.message : "A kép mentése nem sikerült.")
    } finally {
      setPending(false)
    }
  }
  return (
    <Field>
      <FieldLabel htmlFor={`image-${product.id}`}>Termékkép</FieldLabel>
      <div className="w-full max-w-48">
        <ProductIcon icon={product.icon} image={image} name={product.name} />
      </div>
      <Input
        id={`image-${product.id}`}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={pending}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0]
          event.currentTarget.value = ""
          if (file) void save(file)
        }}
      />
      {image ? (
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => void save()}
        >
          Kép törlése
        </Button>
      ) : null}
      <span role="status" aria-live="polite">
        {pending ? "Kép mentése…" : status}
      </span>
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>{error}</AlertTitle>
        </Alert>
      ) : null}
    </Field>
  )
}
