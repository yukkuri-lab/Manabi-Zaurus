import type { CSSProperties } from 'react'
import { CREATION_VIEWBOX_HEIGHT, CREATION_VIEWBOX_WIDTH, T_REX_OUTLINE, creationPartClass, creationStrokePath, type CustomDinosaur } from './creationModel'

export function CreatedDinosaurSvg({ creation, animated = false, className = '' }: { creation: CustomDinosaur; animated?: boolean; className?: string }) {
  return (
    <svg className={`created-dinosaur-svg ${className}`.trim()} viewBox={`0 0 ${CREATION_VIEWBOX_WIDTH} ${CREATION_VIEWBOX_HEIGHT}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={`じぶんで かいた ${creation.name}`}>
      <g className={animated ? 'created-dinosaur is-alive' : 'created-dinosaur'} style={{ '--creation-line': creation.lineColor } as CSSProperties}>
        <path d={T_REX_OUTLINE} fill={creation.bodyColor} opacity="0.92" />
        {creation.strokes.map((stroke, index) => <path key={`${stroke.stepIndex}-${index}`} className={animated ? creationPartClass(stroke.stepIndex) : undefined} d={creationStrokePath(stroke.points)} fill="none" stroke={creation.lineColor} strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />)}
      </g>
    </svg>
  )
}
