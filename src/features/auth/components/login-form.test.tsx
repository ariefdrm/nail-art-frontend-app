import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it, vi } from 'vitest'

import { getAccessToken } from '@/lib/auth/token-store'
import { renderWithRouter } from '@/test/render-with-router'
import { API, server } from '@/test/server'

import { LoginForm } from './login-form'

const ME = {
  id: '44444444-4444-4444-8444-444444444444',
  name: 'Siti',
  email: 'o@x.test',
  role: 'owner',
}

function grant() {
  return HttpResponse.json({
    data: {
      access_token: 'access-1',
      refresh_token: 'must-be-ignored',
      token_type: 'Bearer',
      expires_in: 900,
    },
  })
}

async function fill(
  user: ReturnType<typeof userEvent.setup>,
  email = 'o@x.test',
  password = 'secret',
) {
  await user.type(screen.getByLabelText('Email'), email)
  await user.type(screen.getByLabelText('Kata sandi'), password)
  await user.click(screen.getByRole('button', { name: 'Masuk' }))
}

describe('LoginForm', () => {
  it('signs in: keeps the access token in memory and stores no secret', async () => {
    let sent: unknown
    server.use(
      http.post(`${API}/auth/login`, async ({ request }) => {
        sent = await request.json()
        return grant()
      }),
      http.get(`${API}/auth/me`, () => HttpResponse.json({ data: ME })),
    )
    const onSignedIn = vi.fn()
    const user = userEvent.setup()
    await renderWithRouter(<LoginForm onSignedIn={onSignedIn} />)

    await fill(user)

    await vi.waitFor(() => expect(onSignedIn).toHaveBeenCalled())
    expect(sent).toEqual({ email: 'o@x.test', password: 'secret' })
    expect(getAccessToken()).toBe('access-1')
    const stored = JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage })
    expect(stored).not.toContain('must-be-ignored')
    expect(localStorage.getItem('np.session')).toBe('1')
  })

  it('says the same thing for any wrong credential', async () => {
    server.use(
      http.post(`${API}/auth/login`, () =>
        HttpResponse.json({ error: { code: 'UNAUTHORIZED', message: 'x' } }, { status: 401 }),
      ),
    )
    const onSignedIn = vi.fn()
    const user = userEvent.setup()
    await renderWithRouter(<LoginForm onSignedIn={onSignedIn} />)

    await fill(user)

    expect(await screen.findByText('Email atau kata sandi salah.')).toBeInTheDocument()
    expect(onSignedIn).not.toHaveBeenCalled()
    expect(getAccessToken()).toBeNull()
  })

  it('shows a countdown and disables the button on 429', async () => {
    server.use(
      http.post(`${API}/auth/login`, () =>
        HttpResponse.json(
          { error: { code: 'RATE_LIMITED', message: 'x' } },
          { status: 429, headers: { 'Retry-After': '45' } },
        ),
      ),
    )
    const user = userEvent.setup()
    await renderWithRouter(<LoginForm onSignedIn={vi.fn()} />)

    await fill(user)

    expect(await screen.findByText(/Coba lagi dalam 45 detik/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Masuk' })).toBeDisabled()
  })

  it('asks for both fields before calling the API', async () => {
    const user = userEvent.setup()
    await renderWithRouter(<LoginForm onSignedIn={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Masuk' }))

    expect(await screen.findByText('Email wajib diisi')).toBeInTheDocument()
    expect(screen.getByText('Kata sandi wajib diisi')).toBeInTheDocument()
  })

  it('can show and hide the password', async () => {
    const user = userEvent.setup()
    await renderWithRouter(<LoginForm onSignedIn={vi.fn()} />)
    const field = screen.getByLabelText('Kata sandi')

    expect(field).toHaveAttribute('type', 'password')
    await user.click(screen.getByRole('button', { name: 'Tampilkan kata sandi' }))
    expect(field).toHaveAttribute('type', 'text')
    await user.click(screen.getByRole('button', { name: 'Sembunyikan kata sandi' }))
    expect(field).toHaveAttribute('type', 'password')
  })

  it('explains a forbidden origin instead of blaming the password', async () => {
    server.use(
      http.post(`${API}/auth/login`, () =>
        HttpResponse.json({ error: { code: 'FORBIDDEN', message: 'Origin' } }, { status: 403 }),
      ),
    )
    const user = userEvent.setup()
    await renderWithRouter(<LoginForm onSignedIn={vi.fn()} />)

    await fill(user)

    expect(await screen.findByText(/CORS_ORIGINS/)).toBeInTheDocument()
  })
})
