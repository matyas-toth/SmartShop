import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
export default function HelpPage() {
  return (
    <main className="mx-auto grid max-w-4xl gap-6 p-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Szállítás</CardTitle>
        </CardHeader>
        <CardContent>
          Magyarországon a szállítás 1 490 Ft. A kedvezmény utáni 30 000 Ft-os
          termékértéktől ingyenes. A szállítási és számlázási cím külön
          megadható.
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Fizetés</CardTitle>
        </CardHeader>
        <CardContent>
          A SmartShop egy egyetemi projekt. A fizetés a Stripe
          tesztkörnyezetében történik, valódi terhelés és kiszállítás nélkül. A
          rendelés fizetéséről e-mailes visszaigazolás érkezik.
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Rendelés lemondása</CardTitle>
        </CardHeader>
        <CardContent>
          A még fel nem adott rendelést a rendelés részleteinél mondhatod le.
          Fizetett rendelésnél a visszatérítés a Stripe tesztkörnyezetében indul
          el.
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Kedvezmények</CardTitle>
        </CardHeader>
        <CardContent>
          Rendelésenként egy kupon használható. A lejárat, a minimum kosárérték
          és a termékkorlátozások ellenőrzése a rendelés véglegesítésekor is
          megtörténik.
        </CardContent>
      </Card>
    </main>
  )
}
