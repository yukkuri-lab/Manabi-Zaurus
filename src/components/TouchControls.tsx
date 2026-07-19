import { gameEvents } from '../game/events/gameEvents'

const start = (direction: 'left' | 'right' | 'up' | 'down') => gameEvents.emit('world:move', { direction, active: true })
const stop = (direction: 'left' | 'right' | 'up' | 'down') => gameEvents.emit('world:move', { direction, active: false })

export function TouchControls() {
  const directionButton = (direction: 'left' | 'right' | 'up' | 'down', label: string) => (
    <button
      className={`dpad-button dpad-button--${direction}`}
      aria-label={`${label}へ歩く`}
      onPointerDown={(event) => {
        event.preventDefault()
        event.currentTarget.setPointerCapture(event.pointerId)
        start(direction)
      }}
      onPointerUp={(event) => {
        stop(direction)
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
      }}
      onPointerCancel={() => stop(direction)}
      onLostPointerCapture={() => stop(direction)}
      onContextMenu={(event) => event.preventDefault()}
    >{label}</button>
  )

  return (
    <div className="touch-controls" aria-label="画面操作ボタン">
      <div className="dpad">
        {directionButton('up', '↑')}{directionButton('left', '←')}{directionButton('right', '→')}{directionButton('down', '↓')}
      </div>
      <div className="explore-control-hint" aria-live="polite">
        <span aria-hidden="true">◎</span>
        <div><strong>目印に 近づこう</strong><small>近づくと 自動で 見つかるよ</small></div>
      </div>
    </div>
  )
}
