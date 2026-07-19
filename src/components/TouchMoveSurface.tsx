import { useEffect, useRef, useState } from 'react'
import { gameEvents } from '../game/events/gameEvents'

export type MoveDirection = 'left' | 'right' | 'up' | 'down'

const DEAD_ZONE = 16

/** Convert a drag vector into the one direction the hero should walk. */
export function touchDirectionFromDelta(dx: number, dy: number): MoveDirection | null {
  if (Math.hypot(dx, dy) < DEAD_ZONE) return null
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? 'right' : 'left'
  return dy >= 0 ? 'down' : 'up'
}

const setDirection = (direction: MoveDirection | null, previous: MoveDirection | null) => {
  if (direction === previous) return direction
  if (previous) gameEvents.emit('world:move', { direction: previous, active: false })
  if (direction) gameEvents.emit('world:move', { direction, active: true })
  return direction
}

/**
 * A pointer surface shared by touchscreens and desktop trackpads.
 * The pointer must be held down while dragging; this prevents a normal mouse
 * cursor movement from unexpectedly walking the child around the map.
 */
export function TouchMoveSurface() {
  const surfaceRef = useRef<HTMLDivElement>(null)
  const pointerRef = useRef<{ id: number; x: number; y: number } | null>(null)
  const directionRef = useRef<MoveDirection | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const stopMoving = () => {
    directionRef.current = setDirection(null, directionRef.current)
  }

  useEffect(() => {
    const surface = surfaceRef.current
    if (!surface) return

    // iOS Safari can still attempt a rubber-band scroll during a touch gesture
    // unless the native listener is explicitly non-passive.
    const preventTouchScroll = (event: TouchEvent) => {
      if (pointerRef.current) event.preventDefault()
    }
    surface.addEventListener('touchmove', preventTouchScroll, { passive: false })

    return () => {
      surface.removeEventListener('touchmove', preventTouchScroll)
      stopMoving()
    }
  }, [])

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerRef.current) return
    event.preventDefault()
    if (typeof event.currentTarget.setPointerCapture === 'function') event.currentTarget.setPointerCapture(event.pointerId)
    pointerRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY }
    setIsDragging(true)
  }

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const pointer = pointerRef.current
    if (!pointer || pointer.id !== event.pointerId) return
    event.preventDefault()
    directionRef.current = setDirection(
      touchDirectionFromDelta(event.clientX - pointer.x, event.clientY - pointer.y),
      directionRef.current
    )
  }

  const finishPointer = (event?: React.PointerEvent<HTMLDivElement>) => {
    const pointer = pointerRef.current
    if (!pointer || (event && pointer.id !== event.pointerId)) return
    stopMoving()
    pointerRef.current = null
    if (event && typeof event.currentTarget.hasPointerCapture === 'function' && event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    setIsDragging(false)
  }

  return (
    <div
      ref={surfaceRef}
      className={`game-touch-surface${isDragging ? ' is-dragging' : ''}`}
      role="application"
      aria-label="ゲーム画面を押したまま動かして主人公をうごかす"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finishPointer}
      onPointerCancel={finishPointer}
      onLostPointerCapture={finishPointer}
      onContextMenu={(event) => event.preventDefault()}
    >
      <span className="game-touch-hint" aria-live="polite">
        {isDragging ? 'おさんぽ中…' : '画面を おして ひっぱって あるこう'}
      </span>
    </div>
  )
}
