import type { Metadata } from "next"

import { AdminPanel } from "@/components/admin-panel"

export const metadata: Metadata = {
  title: "Admin | SmartShop",
  description: "A SmartShop mock localStorage katalóguskezelője.",
}

export default function AdminPage() {
  return <AdminPanel />
}
