import { describe, expect, it } from 'vitest'
import { customDinosaurScaleXForDirection } from './creationModel'

describe('custom dinosaur game direction', () => {
  it('faces right with the other characters while moving right', () => {
    expect(customDinosaurScaleXForDirection(1)).toBe(-1)
  })

  it('faces left with the other characters while moving left', () => {
    expect(customDinosaurScaleXForDirection(-1)).toBe(1)
  })
})
