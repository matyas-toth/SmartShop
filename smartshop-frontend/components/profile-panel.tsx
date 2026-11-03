"use client"
import { useEffect, useState } from "react"
import { authClient } from "@/lib/auth-client"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
type Address = {
  id: string
  label: string
  name: string
  phone: string
  postalCode: string
  city: string
  street: string
  isDefault: boolean
}
export function ProfilePanel() {
  const [data, setData] = useState<{
    user: { name: string; email: string; phone: string } | null
    addresses: Address[]
  }>({ user: null, addresses: [] })
  const [editing, setEditing] = useState<Address | null>(null)
  const [formKey, setFormKey] = useState(0)
  const [message, setMessage] = useState("")
  const [pending, setPending] = useState(false)
  async function refresh() {
    const r = await fetch("/api/account")
    if (!r.ok) throw new Error("A profil nem tölthető be.")
    setData(await r.json())
  }
  useEffect(() => {
    fetch("/api/account")
      .then((r) => {
        if (!r.ok) throw new Error("A profil nem tölthető be.")
        return r.json()
      })
      .then(setData)
      .catch((e) => setMessage(e.message))
  }, [])
  async function save(action: string, input?: unknown, id?: string) {
    setPending(true)
    setMessage("")
    try {
      const r = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id, data: input }),
      })
      const result = await r.json()
      if (!r.ok) throw new Error(result.error)
      await refresh()
      setMessage("A változtatásokat mentettük.")
      return true
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "A mentés nem sikerült.")
      return false
    } finally {
      setPending(false)
    }
  }
  return (
    <div className="flex flex-col gap-6">
      {message ? (
        <Alert>
          <AlertTitle>{message}</AlertTitle>
        </Alert>
      ) : null}
      <div className="grid items-start gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Adataim</CardTitle>
          </CardHeader>
          <CardContent>
            {data.user ? (
              <form
                key={data.user.name + ":" + data.user.phone}
                className="flex flex-col gap-4"
                onSubmit={(e) => {
                  e.preventDefault()
                  const f = new FormData(e.currentTarget)
                  void save("profile", {
                    name: f.get("name"),
                    phone: f.get("phone"),
                  })
                }}
              >
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="profile-name">Név</FieldLabel>
                    <Input
                      id="profile-name"
                      name="name"
                      defaultValue={data.user.name}
                      minLength={3}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="profile-email">E-mail</FieldLabel>
                    <Input
                      id="profile-email"
                      type="email"
                      readOnly
                      value={data.user.email}
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="profile-phone">Telefonszám</FieldLabel>
                    <Input
                      id="profile-phone"
                      name="phone"
                      defaultValue={data.user.phone}
                      type="tel"
                    />
                  </Field>
                </FieldGroup>
                <Button type="submit" disabled={pending}>
                  Profil mentése
                </Button>
              </form>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Jelszó módosítása</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-col gap-4"
              onSubmit={async (e) => {
                e.preventDefault()
                const f = new FormData(e.currentTarget)
                setPending(true)
                try {
                  const result = await authClient.changePassword({
                    currentPassword: String(f.get("current")),
                    newPassword: String(f.get("new")),
                    revokeOtherSessions: true,
                  })
                  setMessage(result.error?.message ?? "A jelszót módosítottuk.")
                } catch {
                  setMessage("A jelszó nem módosítható.")
                } finally {
                  setPending(false)
                }
              }}
            >
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="current-password">
                    Jelenlegi jelszó
                  </FieldLabel>
                  <Input
                    id="current-password"
                    name="current"
                    type="password"
                    autoComplete="current-password"
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="new-password">Új jelszó</FieldLabel>
                  <Input
                    id="new-password"
                    name="new"
                    type="password"
                    autoComplete="new-password"
                    minLength={12}
                    required
                  />
                </Field>
              </FieldGroup>
              <Button type="submit" disabled={pending}>
                Jelszó mentése
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
      <div className="grid items-start gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Mentett címek</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {data.addresses.map((a) => (
              <div key={a.id} className="flex flex-col gap-2">
                <CardTitle>
                  {a.label}{" "}
                  {a.isDefault ? <Badge>Alapértelmezett</Badge> : null}
                </CardTitle>
                <div>
                  {a.name} · {a.phone}
                </div>
                <div>
                  {a.postalCode} {a.city}, {a.street}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pending}
                    onClick={() => {
                      setEditing(a)
                      setFormKey((n) => n + 1)
                    }}
                  >
                    Szerkesztés
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={pending}
                    onClick={() => void save("address.delete", undefined, a.id)}
                  >
                    Törlés
                  </Button>
                </div>
              </div>
            ))}
            {!data.addresses.length ? (
              <span>Még nincs mentett címed.</span>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{editing ? "Cím szerkesztése" : "Új cím"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              key={formKey}
              className="flex flex-col gap-4"
              onSubmit={async (e) => {
                e.preventDefault()
                const f = new FormData(e.currentTarget)
                const input = Object.fromEntries(f)
                if (
                  await save(
                    "address.save",
                    {
                      ...input,
                      country: "HU",
                      isDefault: f.get("isDefault") === "on",
                    },
                    editing?.id
                  )
                ) {
                  setEditing(null)
                  setFormKey((n) => n + 1)
                }
              }}
            >
              <FieldGroup>
                {[
                  ["label", "Cím neve"],
                  ["name", "Címzett neve"],
                  ["phone", "Címzett telefonszáma"],
                  ["postalCode", "Irányítószám"],
                  ["city", "Város"],
                  ["street", "Utca, házszám"],
                ].map(([key, label]) => (
                  <Field key={key}>
                    <FieldLabel htmlFor={`address-${key}`}>{label}</FieldLabel>
                    <Input
                      id={`address-${key}`}
                      name={key}
                      defaultValue={
                        (editing?.[key as keyof Address] as string) ?? ""
                      }
                      required
                      pattern={key === "postalCode" ? "[0-9]{4}" : undefined}
                    />
                  </Field>
                ))}
                <Field orientation="horizontal">
                  <Checkbox
                    id="default-address"
                    name="isDefault"
                    defaultChecked={editing?.isDefault ?? false}
                  />
                  <FieldLabel htmlFor="default-address">
                    Alapértelmezett cím
                  </FieldLabel>
                </Field>
              </FieldGroup>
              <div className="flex gap-3">
                <Button type="submit" disabled={pending}>
                  Cím mentése
                </Button>
                {editing ? (
                  <Button
                    variant="ghost"
                    type="button"
                    onClick={() => {
                      setEditing(null)
                      setFormKey((n) => n + 1)
                    }}
                  >
                    Mégse
                  </Button>
                ) : null}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
