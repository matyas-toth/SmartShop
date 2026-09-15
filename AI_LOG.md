# AI prompt napló

## 2026-09-15 — 1. heti MVP

> Ez egy féléves projekt az egyik egyetemi tárgyamra, ahol web appokat fejlesztünk.
>
> Készítsd el a következőt: SmartShop
> Kis webshop termékekkel, kosárral és megrendelésekkel.
>
> Jelenleg a célunk egy első heti MVP, amiben ezek vannak:
> Terméklista, kosárba helyezés és kosárösszeg.
>
> Ne készíts adatbázist, illetve backendet, kizárólag frontend legyen, az adatok localStorage-ba mentődjenek és az egész csak egy mock MVP célt szolgáljon egyelőre. Dolgozz a smartshop-frontend mappában található NextJS projectbe.
>
> A frontend projektbe már előre van telepítve nextjs, tailwind, shadcn/ui. A shadcn/ui témája már teljesen be van konfigurálva a globals.css-ben, illetve az összes shadcn komponens be van töltve a components/ui mappába. A UI elkészítéséhez KIZÁRÓLAG shadcn komponenseket használhatsz, ezek stílusát ne írd felül, mivel a globals.css kezeli, kizárólag layout stílusmeghatározásokat használj, és ezekre a kizárólagos shadcn/ui primitívekre építsd fel a teljes UI-t és az alkalmazás kinézetét. Ne generálj design-t előre képként, kizárólag kódolj. Ha valaha stílusfelülírást kell végezned, azt a components/ui mappán belül található shadcn komponenseken végezd el hogy az összes helyen módosuljon, vagy a globals.css-ben. Minden egyéb esetben maradj az app alap, már létező stílusánál.
>
> A UX legyen kellemes, egyszerűen kezelhető és hasonlítson egy webshopra a kinézet. A checkout-nál akár egy mock fizető screen-t is összeállíthatsz ami tetszőlegesen jelzi a sikeres bankkártyás fizetést.
>
> A web app már támogat dark/light mode switchinget, erre egy gombot rakhatsz a top bar jobb tetejére. Nézzen ki úgy, mint egy kiforrott webshop, de még csak mock jelleggel.
>
> Valódi product mintákat nézhetsz a https://shadcncraft.com/blocks oldalról. (Inspirációnak)
>
> Kérlek vezesd log-szerűen az én összes prompt-omat amit neked küldök egy AI_LOG.md fileban a projekt gyökerében (A SmartShop gyökerében, ne a frontend gyökerében), kezdve ezzel a prompttal együtt és ez történjen így a teljes projekt fejlesztésén keresztül. (A válaszaidat nem kell rögzíteni)
>
> Készítsd el kizárólag a definiált 1. heti MVP-t.

## 2026-09-15 — UI polish, admin és katalógusbővítés

> Használd a `$make-interfaces-feel-better` skill-t, hogy a felület UI-át kicsit érdekesebbé és jobbá tedd. Pl. animációk a „kosárba” gombra, változzon meg kicsit a gomb amit már hozzáadtál ott például eltávolítás az alap action.
>
> Készíts emelett egy mock admin panelt ami elérhető a /admin oldalon (autentikáció nélkül egyelőre), ahol szintén localstorage-ba lehet adminisztrálni a termékeket. Kategóriákat lehet létrehozni, illetve azon belül termékeket, a termékeket könnyen lehet szerkeszteni, kategóriákon át áthúzgálni, illetve a fő storefront navbarja kapjon navigációs itemeket a létrehozott kategóriák alapján, plusz készíts el egy jól kinéző termékkeresőt is (maybe jobb fent navbar, keresési sáv, ha megnyomod bejön egy shadnc Command component). Illetve kapjon minden termék saját product oldalt is mint ahogy rendes boltokban szokott ez lenni.
>
> Ne használd a clean shadcn admin skillt kérlek.
