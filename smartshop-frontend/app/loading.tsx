import { Skeleton } from "@/components/ui/skeleton"
export default function Loading() {
  return (
    <main
      aria-label="Betöltés"
      className="mx-auto grid max-w-7xl grid-cols-2 gap-5 p-6 lg:grid-cols-4"
    >
      {Array.from({ length: 8 }, (_, i) => (
        <Skeleton key={i} className="h-72" />
      ))}
    </main>
  )
}
