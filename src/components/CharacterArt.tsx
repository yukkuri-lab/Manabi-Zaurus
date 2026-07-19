interface CharacterArtProps {
  kind?: 'mojira' | 'egg' | 'triceratops' | 'stegosaurus' | 'pteranodon' | 'tyrannosaurus'
  mood?: string
  hidden?: boolean
}

export function CharacterArt({ kind = 'mojira', mood = 'happy', hidden = false }: CharacterArtProps) {
  return (
    <div className={`character-art character-art--${kind} character-art--${mood} ${hidden ? 'is-hidden' : ''}`} aria-hidden="true">
      <span className="character-tail" />
      <span className="character-body">
        <span className="character-spot character-spot--one" />
        <span className="character-spot character-spot--two" />
      </span>
      <span className="character-head">
        <span className="character-eye character-eye--left" />
        <span className="character-eye character-eye--right" />
        <span className="character-mouth" />
      </span>
      <span className="character-leg character-leg--left" />
      <span className="character-leg character-leg--right" />
      <span className="character-detail" />
    </div>
  )
}
