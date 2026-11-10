import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { StatusBadge } from './status-badge'

import type { BookingStatus } from '@/lib/api/types'

describe('StatusBadge', () => {
  it.each<[BookingStatus, string]>([
    ['pending', 'Menunggu konfirmasi'],
    ['confirmed', 'Terkonfirmasi'],
    ['completed', 'Selesai'],
    ['cancelled', 'Dibatalkan'],
    ['no_show', 'Tidak hadir'],
  ])('shows the label for %s', (status, label) => {
    render(<StatusBadge status={status} />)
    expect(screen.getByText(label)).toBeInTheDocument()
  })
})
