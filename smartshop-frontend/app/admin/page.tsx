import type { Metadata } from "next"

import { AdminPanel } from "@/components/admin-panel"
import { requireManager } from "@/lib/server-access"
import { redirect } from "next/navigation"

export const metadata: Metadata = {
  title: "Admin | SmartShop",
  description: "SmartShop adminisztráció",
}

export default async function AdminPage() {
  try {
    await requireManager()
  } catch {
    redirect("/login")
  }
  return (
    <>
      <AdminPanel />
    </>
  )
}
