import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { HeroVisual } from './hero-visual'

describe('HeroVisual', () => {
  it('is announced as one image and hides its sample controls', () => {
    render(<HeroVisual />)
    const image = screen.getByRole('img', { name: /Ilustrasi kuku/ })
    expect(image).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
