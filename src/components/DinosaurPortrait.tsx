import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { dinosaurById } from '../data/dinosaurs'
import { CharacterArt } from './CharacterArt'

const artKind = (id: string) => id === 'baby-triceratops'
  ? 'triceratops'
  : id as 'mojira' | 'stegosaurus' | 'pteranodon' | 'tyrannosaurus'

interface DinosaurPortraitProps {
  dinosaurId: string
  hidden?: boolean
  className?: string
  alt?: string
}

export function DinosaurPortrait({ dinosaurId, hidden = false, className = '', alt }: DinosaurPortraitProps) {
  const dinosaur = dinosaurById[dinosaurId]
  const [imageFailed, setImageFailed] = useState(false)

  useEffect(() => setImageFailed(false), [dinosaurId, dinosaur?.imageUrl])

  if (dinosaur?.imageUrl && !imageFailed) {
    return (
      <img
        className={`dinosaur-portrait ${hidden ? 'is-hidden' : ''} ${className}`.trim()}
        src={dinosaur.imageUrl}
        alt={hidden ? '' : (alt ?? dinosaur.name)}
        onError={() => setImageFailed(true)}
      />
    )
  }

  return (
    <div
      className={`dinosaur-fallback ${hidden ? 'is-hidden' : ''} ${className}`.trim()}
      role={hidden ? undefined : 'img'}
      aria-label={hidden ? undefined : (alt ?? dinosaur?.name ?? 'きょうりゅう')}
      style={{ '--dino-color': dinosaur?.color } as CSSProperties}
    >
      <CharacterArt kind={artKind(dinosaurId)} hidden={hidden} />
    </div>
  )
}
