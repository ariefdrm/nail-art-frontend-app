import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { renderWithRouter } from '@/test/render-with-router'

import { CustomerHeader } from './customer-header'

describe('CustomerHeader', () => {
  it('offers a skip link, the main navigation and the booking action', async () => {
    await renderWithRouter(<CustomerHeader />)

    expect(screen.getByRole('link', { name: 'Lewati ke konten' })).toHaveAttribute(
      'href',
      '#konten',
    )
    const nav = screen.getByRole('navigation', { name: 'Utama' })
    expect(nav).toHaveTextContent('Layanan')
    expect(nav).toHaveTextContent('Cek booking')
    expect(nav).toHaveTextContent('Pesan')
  })

  it('opens the menu from the labelled button and lists every destination', async () => {
    const user = userEvent.setup()
    await renderWithRouter(<CustomerHeader />)

    await user.click(screen.getByRole('button', { name: 'Buka menu' }))

    const menu = await screen.findByRole('navigation', { name: 'Menu' })
    expect(menu).toHaveTextContent('Beranda')
    expect(menu).toHaveTextContent('Layanan')
    expect(menu).toHaveTextContent('Cek booking')
  })
})
