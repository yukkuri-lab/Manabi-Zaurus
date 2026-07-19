import { describe, expect, it } from 'vitest'
import { touchDirectionFromDelta } from './TouchMoveSurface'

describe('touchDirectionFromDelta', () => {
  it('ignores tiny movement near the starting point', () => {
    expect(touchDirectionFromDelta(8, 8)).toBeNull()
  })

  it('chooses the dominant horizontal direction', () => {
    expect(touchDirectionFromDelta(80, 20)).toBe('right')
    expect(touchDirectionFromDelta(-80, 20)).toBe('left')
  })

  it('chooses the dominant vertical direction', () => {
    expect(touchDirectionFromDelta(20, 80)).toBe('down')
    expect(touchDirectionFromDelta(20, -80)).toBe('up')
  })
})
