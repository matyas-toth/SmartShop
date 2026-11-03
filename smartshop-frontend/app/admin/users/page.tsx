import { AdminCommerce } from "@/components/admin-commerce"
import { requireManager } from "@/lib/server-access"
import { notFound } from "next/navigation"
export default async function Page() {
  if ((await requireManager()).role !== "ADMIN") notFound()
  return <AdminCommerce section="users" />
}
