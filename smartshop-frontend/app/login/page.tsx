import { AccountForm } from "@/components/account-form"
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>
}) {
  const query = await searchParams
  const next =
    query.next?.startsWith("/") && !query.next.startsWith("//")
      ? query.next
      : "/account"
  return (
    <main className="p-6">
      <AccountForm next={next} oauthError={query.error} />
    </main>
  )
}
