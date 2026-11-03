"use client"
import { Card, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
export default function ErrorPage({
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <main className="mx-auto max-w-xl p-8">
      <Card>
        <CardHeader>
          <CardTitle>Az oldal betöltése nem sikerült</CardTitle>
        </CardHeader>
        <CardFooter>
          <Button onClick={reset}>Újrapróbálom</Button>
        </CardFooter>
      </Card>
    </main>
  )
}
