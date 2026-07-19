import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { CREATION_COLORS, CREATION_VIEWBOX_HEIGHT, CREATION_VIEWBOX_WIDTH, T_REX_OUTLINE, creationStrokePath, type CreationPoint, type CreationStroke, type CustomDinosaur } from './creationModel'
import { clearCreationDraft, loadCreationDraft, loadCreations, saveCreation, saveCreationDraft } from './creationStore'

type RouteSample = CreationPoint & { progress: number }
type DrawingStep = { id: string; title: string; instruction: string; path: string }

const SAMPLE_COUNT = 360
const TRACE_TOLERANCE = 58
const RESUME_RADIUS = 78
const FORWARD_SAMPLES = 58
const MAX_SNAP_DISTANCE = 16

const distance = (a: CreationPoint, b: CreationPoint) => Math.hypot(a.x - b.x, a.y - b.y)

const fixedOutlinePoints = (path: string) => [...path.matchAll(/(?:M|L)\s+(-?[\d.]+)\s+(-?[\d.]+)/g)].map((match) => ({ x: Number(match[1]), y: Number(match[2]) }))
const pathFromPoints = (points: CreationPoint[]) => points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')

const createSteps = (): DrawingStep[] => {
  const points = fixedOutlinePoints(T_REX_OUTLINE)
  return [
    { id: 'head', title: 'おおきな あたま', instruction: 'まずは、おおきな あたま！', path: pathFromPoints(points.slice(0, 11)) },
    { id: 'back-tail', title: 'せなかと しっぽ', instruction: 'ながい しっぽを、ぐーっと！', path: pathFromPoints([points[0], ...points.slice(61).reverse()]) },
    { id: 'under-tail', title: 'しっぽの した', instruction: 'しっぽの したを もどるよ', path: pathFromPoints(points.slice(57, 62).reverse()) },
    { id: 'back-leg', title: 'ふとい うしろあし', instruction: 'ふとい あしを かこう！', path: pathFromPoints(points.slice(47, 58).reverse()) },
    { id: 'front-leg', title: 'もうひとつの あし', instruction: 'もうひとつの あしだよ', path: pathFromPoints(points.slice(25, 48).reverse()) },
    { id: 'little-arm', title: 'ちいさな おてて', instruction: 'ちいさな おてて！', path: 'M 512 423 C 488 432 466 449 456 473 C 458 488 471 491 480 472 C 478 489 487 501 498 481 C 503 493 516 490 528 466' },
    { id: 'eye', title: 'やさしい おめめ', instruction: 'やさしい おめめを かこう', path: 'M 460 190 A 14.5 18.5 0 1 1 431 190 A 14.5 18.5 0 1 1 460 190' },
    { id: 'mouth', title: 'おくちと は', instruction: 'さいごは、おくち！', path: pathFromPoints(points.slice(10, 26)) }
  ]
}

const softlySnappedPoint = (point: CreationPoint, guide: CreationPoint) => {
  const gap = distance(point, guide)
  if (gap === 0 || gap > TRACE_TOLERANCE) return point
  const correction = Math.min(MAX_SNAP_DISTANCE, gap * 0.22)
  return { x: point.x + (guide.x - point.x) / gap * correction, y: point.y + (guide.y - point.y) / gap * correction }
}

export function CreationStudio({ onBack, onGallery, onAdventure }: { onBack: () => void; onGallery: () => void; onAdventure: (creation: CustomDinosaur) => void }) {
  const steps = useMemo(createSteps, [])
  const guideRef = useRef<SVGPathElement>(null)
  const samplesRef = useRef<RouteSample[]>([])
  const progressRef = useRef(0)
  const tracingRef = useRef(false)
  const doneRef = useRef(false)
  const activeStrokeRef = useRef<CreationPoint[]>([])
  const [stepIndex, setStepIndex] = useState(0)
  const [stepProgress, setStepProgress] = useState(0)
  const [stepDone, setStepDone] = useState(false)
  const [ready, setReady] = useState(false)
  const [tracing, setTracing] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [strokes, setStrokes] = useState<CreationStroke[]>([])
  const [draftStroke, setDraftStroke] = useState<CreationPoint[]>([])
  const [routeSamples, setRouteSamples] = useState<RouteSample[]>([])
  const [selectedColor, setSelectedColor] = useState('#6fbe5a')
  const [showExample, setShowExample] = useState(false)
  const [storageReady, setStorageReady] = useState(false)
  const [saveState, setSaveState] = useState<'saving' | 'saved'>('saving')
  const [savedCreation, setSavedCreation] = useState<CustomDinosaur | null>(null)
  const currentStep = steps[stepIndex]

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const draft = loadCreationDraft()
      if (draft) {
        const restoredStepIds = new Set(draft.strokes.map((stroke) => stroke.stepIndex))
        const hasPreviousSteps = Array.from({ length: draft.stepIndex }, (_, index) => index).every((index) => restoredStepIds.has(index))
        const hasCurrentStepWhenDone = !draft.stepDone || restoredStepIds.has(draft.stepIndex)
        if (!hasPreviousSteps || !hasCurrentStepWhenDone) {
          clearCreationDraft()
          setStorageReady(true)
          return
        }
        const restoredCreation = draft.savedCreationId ? loadCreations().find((item) => item.id === draft.savedCreationId) ?? null : null
        setStepIndex(draft.stepIndex)
        setStepProgress(draft.stepProgress)
        progressRef.current = draft.stepProgress
        setStepDone(draft.stepDone)
        doneRef.current = draft.stepDone
        setStrokes(draft.strokes)
        setSelectedColor(draft.selectedColor)
        setCompleted(draft.completed && Boolean(restoredCreation))
        setSavedCreation(restoredCreation)
      }
      setStorageReady(true)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    const path = guideRef.current
    if (!path || completed) return
    const totalLength = path.getTotalLength()
    const samples = Array.from({ length: SAMPLE_COUNT + 1 }, (_, index) => {
      const progress = index / SAMPLE_COUNT
      const point = path.getPointAtLength(totalLength * progress)
      return { x: point.x, y: point.y, progress }
    })
    samplesRef.current = samples
    setRouteSamples(samples)
    setReady(true)
  }, [completed, currentStep.path, stepIndex])

  useEffect(() => {
    if (!storageReady) return
    setSaveState('saving')
    const timer = window.setTimeout(() => {
      saveCreationDraft({ version: 1, stepIndex, stepProgress, stepDone, strokes, selectedColor, completed, savedCreationId: savedCreation?.id ?? null, updatedAt: Date.now() })
      setSaveState('saved')
    }, 160)
    return () => window.clearTimeout(timer)
  }, [completed, savedCreation?.id, selectedColor, stepDone, stepIndex, stepProgress, storageReady, strokes])

  const currentSample = useMemo(() => {
    if (routeSamples.length === 0) return { x: 0, y: 0, progress: 0 }
    return routeSamples[Math.max(0, Math.min(SAMPLE_COUNT, Math.round(stepProgress * SAMPLE_COUNT)))]
  }, [routeSamples, stepProgress])
  const goalSample = routeSamples.at(-1) ?? currentSample
  const arrow = useMemo(() => {
    if (routeSamples.length < 8) return { x: 0, y: 0, angle: 0 }
    const center = Math.min(routeSamples.length - 4, Math.max(3, Math.round((stepProgress + 0.18) * SAMPLE_COUNT)))
    const before = routeSamples[center - 3]
    const after = routeSamples[center + 3]
    return { x: routeSamples[center].x, y: routeSamples[center].y, angle: Math.atan2(after.y - before.y, after.x - before.x) * 180 / Math.PI }
  }, [routeSamples, stepProgress])

  const svgPoint = useCallback((event: ReactPointerEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect()
    return { x: (event.clientX - bounds.left) / bounds.width * CREATION_VIEWBOX_WIDTH, y: (event.clientY - bounds.top) / bounds.height * CREATION_VIEWBOX_HEIGHT }
  }, [])

  const commitStroke = useCallback(() => {
    const points = activeStrokeRef.current
    if (points.length > 1) setStrokes((items) => [...items, { stepIndex, points }])
    activeStrokeRef.current = []
    setDraftStroke([])
  }, [stepIndex])

  const stopTracing = useCallback((event: ReactPointerEvent<SVGSVGElement>) => {
    if (!tracingRef.current) return
    tracingRef.current = false
    setTracing(false)
    commitStroke()
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
  }, [commitStroke])

  const handlePointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!ready || completed || doneRef.current) return
    const point = svgPoint(event)
    if (distance(point, currentSample) > RESUME_RADIUS) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    tracingRef.current = true
    setTracing(true)
    const first = softlySnappedPoint(point, currentSample)
    activeStrokeRef.current = [first]
    setDraftStroke([first])
  }

  const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!tracingRef.current || completed || doneRef.current) return
    event.preventDefault()
    const point = svgPoint(event)
    const currentIndex = Math.round(progressRef.current * SAMPLE_COUNT)
    const start = Math.max(0, currentIndex - 8)
    const end = Math.min(SAMPLE_COUNT, currentIndex + FORWARD_SAMPLES)
    let best = samplesRef.current[start]
    let bestIndex = start
    let bestDistance = Number.POSITIVE_INFINITY
    for (let index = start; index <= end; index += 1) {
      const candidate = samplesRef.current[index]
      const gap = distance(point, candidate)
      if (gap < bestDistance) { best = candidate; bestIndex = index; bestDistance = gap }
    }
    const drawn = bestDistance <= TRACE_TOLERANCE ? softlySnappedPoint(point, best) : point
    const previous = activeStrokeRef.current.at(-1)
    if (!previous || distance(previous, drawn) >= 2.5) {
      activeStrokeRef.current = [...activeStrokeRef.current, drawn]
      setDraftStroke(activeStrokeRef.current)
    }
    if (bestDistance > TRACE_TOLERANCE || bestIndex < currentIndex || best.progress <= progressRef.current) return
    progressRef.current = best.progress
    setStepProgress(best.progress)
    if (best.progress >= 0.985) {
      progressRef.current = 1
      doneRef.current = true
      setStepProgress(1)
      setStepDone(true)
    }
  }

  const prepareStep = (next: number) => {
    progressRef.current = 0
    tracingRef.current = false
    doneRef.current = false
    activeStrokeRef.current = []
    samplesRef.current = []
    setStepIndex(next)
    setStepProgress(0)
    setStepDone(false)
    setTracing(false)
    setDraftStroke([])
    setRouteSamples([])
    setReady(false)
  }

  const goNext = () => {
    if (!stepDone) return
    if (stepIndex < steps.length - 1) return prepareStep(stepIndex + 1)
    const creation = saveCreation({ id: savedCreation?.id ?? null, speciesId: 't-rex', name: 'じぶんの ティラノ', strokes, lineColor: '#302f2a', bodyColor: selectedColor })
    setSavedCreation(creation)
    setCompleted(true)
  }

  const goBack = () => {
    if (stepIndex === 0) return
    const next = stepIndex - 1
    setStrokes((items) => items.filter((stroke) => stroke.stepIndex < next))
    prepareStep(next)
  }

  const startFresh = () => {
    clearCreationDraft()
    setSavedCreation(null)
    setCompleted(false)
    setStrokes([])
    setSelectedColor('#6fbe5a')
    prepareStep(0)
  }

  const recolor = (color: string) => {
    setSelectedColor(color)
    if (!completed || !savedCreation) return
    const updated = saveCreation({ id: savedCreation.id, speciesId: 't-rex', name: savedCreation.name, strokes, lineColor: savedCreation.lineColor, bodyColor: color })
    setSavedCreation(updated)
  }

  const remaining = Math.max(0, steps.length - stepIndex - 1)
  const visibleStrokes = [...strokes, ...(draftStroke.length > 1 ? [{ stepIndex, points: draftStroke }] : [])]

  return <main className="page-shell creation-studio-page">
    <header className="creation-studio-header">
      <button className="button button--secondary" onClick={onBack}>← もどる</button>
      <div><p className="eyebrow">うまれる！ きょうりゅう</p><h1>{completed ? 'できた！' : 'ティラノサウルス'}</h1></div>
      <div className="creation-step-status"><strong>{completed ? '8／8' : `${stepIndex + 1}／8`}</strong><small>{completed ? 'かんせい！' : remaining === 0 ? 'もうすこし！' : `あと${remaining}ほん`}</small><span>{saveState === 'saved' ? '● ほぞんしたよ' : '○ ほぞんちゅう'}</span></div>
    </header>
    <p className={`creation-instruction${stepDone ? ' is-done' : ''}`}>{completed ? 'きみの きょうりゅうが、ぼうけんの なかまになったよ！' : currentStep.instruction}</p>
    <section className="creation-board">
      <svg className={`creation-drawing-svg${tracing ? ' is-tracing' : ''}`} viewBox={`0 0 ${CREATION_VIEWBOX_WIDTH} ${CREATION_VIEWBOX_HEIGHT}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="ティラノサウルスを8ほんのせんでかく" onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={stopTracing} onPointerCancel={stopTracing}>
        {(showExample || completed) && <path d={T_REX_OUTLINE} fill={completed ? selectedColor : 'none'} opacity={completed ? 0.92 : 0.12} stroke={showExample && !completed ? '#385548' : 'none'} strokeWidth="10" />}
        {visibleStrokes.map((stroke, index) => <path key={`${stroke.stepIndex}-${index}`} d={creationStrokePath(stroke.points)} fill="none" stroke={completed ? '#302f2a' : selectedColor} strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" opacity={completed || stroke.stepIndex === stepIndex ? 1 : 0.48} />)}
        {!completed && <>
          <path ref={guideRef} d={currentStep.path} fill="none" stroke="#e9715a" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="22 12" opacity="0.82" />
          {ready && <><circle className="creation-start-pulse" cx={currentSample.x} cy={currentSample.y} r="25" fill="#ffd45f" opacity="0.65" /><circle cx={currentSample.x} cy={currentSample.y} r="10" fill="#e9715a" /><circle cx={goalSample.x} cy={goalSample.y} r="12" fill="#fff8dc" stroke="#719761" strokeWidth="5" /><g transform={`translate(${arrow.x} ${arrow.y}) rotate(${arrow.angle})`}><path d="M -19 -12 L 2 0 L -19 12" fill="none" stroke="#704f3d" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" /></g></>}
        </>}
      </svg>
    </section>
    {!completed ? <div className="creation-actions"><button className="button button--secondary" onClick={goBack} disabled={stepIndex === 0}>ひとつ もどる</button><button className="button button--secondary" onClick={() => setShowExample((value) => !value)}>{showExample ? 'おてほんを とじる' : 'おてほん'}</button><button className="button button--primary button--large" onClick={goNext} disabled={!stepDone}>{stepIndex === 7 ? 'できた！' : 'つぎへ →'}</button></div> : <div className="creation-complete-actions"><button className="button button--primary button--large" onClick={() => savedCreation && onAdventure(savedCreation)}>このこを ぼうけんへ！ →</button><button className="button button--secondary" onClick={onGallery}>じぶんの きょうりゅう</button><button className="button button--secondary" onClick={startFresh}>もういちど かく</button></div>}
    <section className="creation-palette" aria-label="クレヨンの いろ"><p>{completed ? 'からだの いろを えらべるよ' : 'すきな クレヨンを えらんでね'}</p><div>{CREATION_COLORS.map((color) => <button key={color.value} type="button" aria-label={`${color.name}のクレヨン`} aria-pressed={selectedColor === color.value} onClick={() => recolor(color.value)} style={{ background: color.value }} />)}</div></section>
  </main>
}
