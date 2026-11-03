import { PasswordReset } from "@/components/password-reset"
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  return (
    <main className="p-6">
      <PasswordReset token={token} />
    </main>
  )
}
