# SmartShop

## Termékképek

Az admin termékszerkesztőben termékenként egy kép tölthető fel, cserélhető és törölhető.
Új terméknél előbb mentsd a terméket, majd nyisd meg a szerkesztőt.
JPG, PNG és nem animált WebP támogatott, legfeljebb 5 MB és 20 millió pixel.
A szerver a képet legfeljebb 1600×1600-as WebP-vé alakítja, és Postgres bytea mezőbe menti.
A GET /api/products/[id]/image bináris image/webp választ küld ETag támogatással.
A PUT ugyanezen az útvonalon nyers fájlt fogad, a DELETE eltávolítja a képet.
A módosításhoz boltkezelői vagy admin session és helyes Origin fejléc szükséges.
A katalógus kizárólag URL-t ad vissza, nem képadatot vagy base64-et.

## Indítás Windows alatt

1. `npm install`
2. `Copy-Item .env.example .env` kizárólag új telepítéskor. A meglévő .env fájlt őrizd meg.
3. Állíts be egy véletlen, legalább 32 karakteres BETTER_AUTH_SECRET értéket.
4. Állíts be legalább 12 karakteres ADMIN_INITIAL_PASSWORD jelszót.
5. `npm run db:up`
6. `npm run db:generate`
7. `npm run db:migrate`
8. `npm run db:seed`
9. `npm run dev`

Postgres: localhost:54339. Az adatokat a Docker smartshop_data kötete őrzi.
Az admin címe matyastoth.mail@gmail.com. A seed nem ír felül meglévő jelszót.
A jelszavas regisztráció nem fogadja el a fenntartott admincímet.
Az igazolt Google-identitással belépő admincím is adminjogot kap.
Azonos e-mail esetén a Google-fiók a már meglévő helyi fiókhoz kapcsolódik.
Az összekapcsoláshoz a Google által igazolt e-mail szükséges; a helyi regisztrációhoz nem küldünk ellenőrző levelet.

## Integrációk

Google OAuth webes kliens: GOOGLE_CLIENT_ID és GOOGLE_CLIENT_SECRET.
Callback URL: http://localhost:3000/api/auth/callback/google.
Normál e-mailes regisztrációnál nincs e-mail-ellenőrzés.

Stripe: STRIPE_SECRET_KEY csak sk_test_ kezdetű tesztkulcsot fogad el.
Dinamikus price_data kerül a Checkout Sessionbe, nincs regisztrált Price.
A HUF összegek egész forintban vannak az adatbázisban; a Stripe felé százszoros értéket küldünk.
Webhook: /api/stripe/webhook, checkout.session.completed és checkout.session.expired események.
Helyi teszt: stripe listen --forward-to localhost:3000/api/stripe/webhook.
A kiírt webhooktitkot a STRIPE_WEBHOOK_SECRET változóba kell másolni.

Resend: RESEND_API_KEY és EMAIL_FROM, a Resendben hitelesített feladóval.
A levélküldés szerveroldali, idempotenciakulccsal történik.
Sikertelen küldést az npm run maintenance újrapróbál.

## Készletfoglalás

A kosár önmagában nem foglal készletet. A Checkout indítása tranzakcióban foglal.
Lejáratkor a webhook oldja fel a foglalást.
A futó Next.js Node szerver percenként egyezteti a lejárt foglalásokat és újrapróbálja a leveleket.
Kézzel is futtatható az npm run maintenance. Serverless telepítésnél ehhez külön ütemező szükséges.
A Stripe elérhetetlensége esetén nem oldjuk fel bizonyíték nélkül a fizetési foglalást.

## Ellenőrzés

npm run typecheck
npm run build
npx tsx scripts/verify-commerce.ts
npm run test:domain
npm run test:e2e

A böngészős tesztek futó localhost szervert és telepített Microsoft Edge-et használnak.
A tesztadatok elkülönített, véletlen azonosítót kapnak, és futás után törlődnek.
A Stripe tesztkulccsal a regresszió valódi sandbox Checkoutot hoz létre, majd lejáratja azt, kártyaterhelés nélkül.
Az idempotens fizetésfeldolgozást külön izolált eseményfixture ellenőrzi.

## Elkészült folyamatok

Kategóriaoldalak, keresés, rendezés, lapozás és képes termékrács.
Közös fejléc és lábléc a vásárlás, bejelentkezés, profil és admin oldalakon.
Vendég- és felhasználói kosár Postgresben, belépéskori összevonással.
Profil, jelszócsere és saját, szerkeszthető címlista alapértelmezett címmel.
Címmel előtöltött checkout, külön számlázási cím és szerveroldali összesítő.
Admin termék- és kategóriakezelés, áthúzás, képfeltöltés és archiválás.
Kupon létrehozása, szerkesztése, kikapcsolása, időbeli és termékkorlátozása.
Rendelési kereső, szerveroldali lapozás, forgalmi összesítők és részletes rendelések.
Státuszváltás, csomagazonosító, belső megjegyzés, lemondás és sandbox visszatérítés.
Sikeres fizetés után a megvásárolt tételek kikerülnek a szerveroldali kosárból.
A korábbi rendelési árak és terméknevek archiválás után is megmaradnak.

## Mintaképek és külső szolgáltatások

A seed 14 képes mintaterméket készít, a korábbi saját módosítások felülírása nélkül.
A mintafotók Unsplash képek; a pontos forrásazonosítók a prisma/seed.ts fájl photos térképében szerepelnek.
A letöltött képeket a rendszer saját Postgres adatbázisából szolgálja ki, nem távoli hotlinkkel.
A saját képfeltöltéseket az ismételt seed nem írja felül.

A Google-belépéshez saját OAuth kliens kell. A regresszió az igazolt identitás utáni fiókösszekapcsolást izolált Better Auth tesztpéldányon ellenőrzi.
A tényleges e-mailküldéshez Resend API-kulcs és hitelesített feladó szükséges.
Resend nélkül a fizetés és a rendelés mentése működik; a visszaigazolás küldését később az adminból vagy a háttérfolyamattal lehet újrapróbálni.
