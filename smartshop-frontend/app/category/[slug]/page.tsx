import { db } from "@/lib/db"
import { notFound } from "next/navigation"
import { Storefront } from "@/components/storefront"
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  if (!(await db.category.findFirst({ where: { slug, active: true } })))
    notFound()
  return <Storefront categorySlug={slug} />
}
