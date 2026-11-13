import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Reveal } from './reveal'

afterEach(() => vi.unstubAllGlobals())

describe('Reveal', () => {
  it('stays hidden until its content scrolls into view', () => {
    let notify: (entries: { isIntersecting: boolean }[]) => void = () => {}
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: typeof notify) {
          notify = callback
        }
        observe() {}
        disconnect() {}
      },
    )
    render(<Reveal>Isi</Reveal>)
    expect(screen.getByText('Isi')).toHaveAttribute('data-visible', 'false')
    notify([{ isIntersecting: true }])
  })
})
