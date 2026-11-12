import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2, TriangleAlert } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { FormField } from '@/components/common/form-field'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLoginMutation } from '@/features/auth/queries'
import { loginSchema } from '@/features/auth/schemas'
import { useCountdown } from '@/hooks/use-countdown'
import { errorMessage, toApiError } from '@/lib/api/errors'
import { rateLimitedMessage } from '@/lib/copy'

import type { LoginValues } from '@/features/auth/schemas'

type LoginFormProps = { onSignedIn: () => void }

export function LoginForm({ onSignedIn }: LoginFormProps) {
  const [isPasswordShown, setIsPasswordShown] = useState(false)
  const [failure, setFailure] = useState<string | null>(null)
  const { secondsLeft, start: startCountdown } = useCountdown()
  const login = useLoginMutation()
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })
  const { errors } = form.formState

  async function handleSubmit(values: LoginValues) {
    setFailure(null)
    try {
      await login.mutateAsync(values)
      onSignedIn()
    } catch (error) {
      const apiError = toApiError(error)
      if (apiError.status === 429) startCountdown(apiError.retryAfter ?? 60)
      else setFailure(errorMessage(apiError, { login: true }))
    }
  }

  const isRateLimited = secondsLeft > 0
  const message = isRateLimited ? rateLimitedMessage(secondsLeft) : failure

  return (
    <form noValidate onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
      {message ? (
        <Alert variant="destructive">
          <TriangleAlert aria-hidden />
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}

      <FormField id="email" label="Email" error={errors.email?.message}>
        {(control) => (
          <Input
            {...control}
            type="email"
            inputMode="email"
            autoComplete="username"
            {...form.register('email')}
          />
        )}
      </FormField>

      <FormField id="password" label="Kata sandi" error={errors.password?.message}>
        {(control) => (
          <div className="relative">
            <Input
              {...control}
              type={isPasswordShown ? 'text' : 'password'}
              autoComplete="current-password"
              className="pr-12"
              {...form.register('password')}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute top-1/2 right-1.5 -translate-y-1/2"
              aria-label={isPasswordShown ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              aria-pressed={isPasswordShown}
              onClick={() => setIsPasswordShown((shown) => !shown)}
            >
              {isPasswordShown ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
            </Button>
          </div>
        )}
      </FormField>

      <Button
        type="submit"
        size="xl"
        className="w-full"
        disabled={login.isPending || isRateLimited}
      >
        {login.isPending ? <Loader2 className="animate-spin" aria-hidden /> : null}
        {login.isPending ? 'Masuk...' : 'Masuk'}
      </Button>
    </form>
  )
}
