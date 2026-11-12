import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { z } from 'zod'

import { Wordmark } from '@/components/common/wordmark'
import { LoginForm } from '@/features/auth/components/login-form'
import { safeAdminPath } from '@/features/auth/schemas'
import { bootstrapSession } from '@/lib/auth/session'

const searchSchema = z.object({
  lanjut: z.string().optional().catch(undefined),
  sesi: z.enum(['berakhir']).optional().catch(undefined),
})

export const Route = createFileRoute('/admin/login')({
  validateSearch: searchSchema,
  head: () => ({
    meta: [{ title: 'Masuk | The Nail Palace' }, { name: 'robots', content: 'noindex' }],
  }),
  beforeLoad: async () => {
    // Someone who is already signed in has no use for the form.
    if (await bootstrapSession()) throw redirect({ to: '/admin' })
  },
  component: LoginPage,
  ssr: false,
})

function LoginPage() {
  const search = Route.useSearch()
  const router = useRouter()

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-8 px-4 py-12">
      <div className="space-y-2">
        <Wordmark />
        <h1 className="pt-4 text-3xl font-semibold tracking-tight">Masuk</h1>
        <p className="text-muted-foreground">Khusus pemilik dan staf The Nail Palace.</p>
      </div>
      {search.sesi === 'berakhir' ? (
        <p role="status" className="rounded-lg border border-border bg-muted p-3 text-sm">
          Sesi berakhir, silakan masuk lagi.
        </p>
      ) : null}
      <LoginForm onSignedIn={() => router.history.push(safeAdminPath(search.lanjut))} />
    </main>
  )
}
