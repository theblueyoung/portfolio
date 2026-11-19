import { useEffect, useRef } from 'react'

const BASE = import.meta.env.BASE_URL
const IMG = 1024 // source image size in px; all geometry below is in source px

// Iris sprites produced by scripts/make-eyes.py
const EYES = [
  { key: 'l', src: `${BASE}aria-iris-l.png`, x: 401, y: 360, size: 40, cx: 421, cy: 379.5 },
  { key: 'r', src: `${BASE}aria-iris-r.png`, x: 558, y: 342, size: 40, cx: 578, cy: 362 },
] as const

// Gaze range (source px) and easing
const GAZE_X = 5.5
const GAZE_UP = 2
const GAZE_DOWN = 1.5
const GAZE_EASE = 0.18

// Head drift / turn toward the cursor
const DRIFT_X = 14
const DRIFT_Y = 8
const TURN_Y = 4 // deg
const TURN_X = 2.5 // deg
const HEAD_EASE = 0.06

const pct = (v: number) => `${(v / IMG) * 100}%`

const SIDE_FADE = 'linear-gradient(to right, transparent 0%, #000 10%, #000 90%, transparent 100%)'

export default function BackgroundCharacter() {
  const headRef = useRef<HTMLDivElement>(null)
  const irisRefs = useRef<(HTMLImageElement | null)[]>([])

  useEffect(() => {
    const head = headRef.current
    if (!head) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Pointer position, or null = look at the viewer.
    let pointer: { x: number; y: number } | null = null
    const headTarget = { x: 0, y: 0 }
    const headNow = { x: 0, y: 0 }
    const gazeNow = EYES.map(() => ({ x: 0, y: 0 }))
    let raf = 0

    const onPointerMove = (e: PointerEvent) => {
      pointer = { x: e.clientX, y: e.clientY }
      headTarget.x = (e.clientX / window.innerWidth - 0.5) * 2
      headTarget.y = (e.clientY / window.innerHeight - 0.5) * 2
    }
    const onLeave = () => {
      pointer = null
      headTarget.x = 0
      headTarget.y = 0
    }

    const tick = () => {
      if (!reduceMotion) {
        headNow.x += (headTarget.x - headNow.x) * HEAD_EASE
        headNow.y += (headTarget.y - headNow.y) * HEAD_EASE
        head.style.transform =
          `perspective(1400px) translate3d(${headNow.x * DRIFT_X}px, ${headNow.y * DRIFT_Y}px, 0) ` +
          `rotateY(${headNow.x * TURN_Y}deg) rotateX(${-headNow.y * TURN_X}deg) scale(1.04)`
      }

      const rect = head.getBoundingClientRect()
      const scale = rect.width / IMG
      EYES.forEach((eye, i) => {
        let tx = 0
        let ty = 0
        if (pointer) {
          // Direction from this eye (on screen) to the pointer.
          const ex = rect.left + eye.cx * scale
          const ey = rect.top + eye.cy * scale
          const dx = pointer.x - ex
          const dy = pointer.y - ey
          tx = Math.tanh(dx / (window.innerWidth * 0.3)) * GAZE_X
          const ny = Math.tanh(dy / (window.innerHeight * 0.3))
          ty = ny * (ny < 0 ? GAZE_UP : GAZE_DOWN)
        }
        const g = gazeNow[i]
        g.x += (tx - g.x) * GAZE_EASE
        g.y += (ty - g.y) * GAZE_EASE
        const el = irisRefs.current[i]
        if (el) el.style.transform = `translate3d(${g.x * scale}px, ${g.y * scale}px, 0)`
      })

      raf = requestAnimationFrame(tick)
    }

    window.addEventListener('pointermove', onPointerMove)
    document.documentElement.addEventListener('pointerleave', onLeave)
    window.addEventListener('blur', onLeave)
    raf = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('blur', onLeave)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#c9ccd4]" aria-hidden="true">
      <div
        ref={headRef}
        className="absolute bottom-0 left-1/2 aspect-square h-full -translate-x-1/2 select-none md:left-auto md:right-[-14%] md:translate-x-0 xl:right-[4%]"
        style={{
          transform: 'scale(1.04)',
          transformOrigin: 'center bottom',
          maskImage: SIDE_FADE,
          WebkitMaskImage: SIDE_FADE,
        }}
      >
        <img src={`${BASE}aria-base.webp`} alt="" draggable={false} className="absolute inset-0 h-full w-full" />

        {/* Irises, clipped to the eye openings */}
        <div
          className="absolute inset-0"
          style={{
            maskImage: `url(${BASE}aria-eye-mask.png)`,
            WebkitMaskImage: `url(${BASE}aria-eye-mask.png)`,
            maskSize: '100% 100%',
            WebkitMaskSize: '100% 100%',
          }}
        >
          {EYES.map((eye, i) => (
            <img
              key={eye.key}
              ref={(el) => {
                irisRefs.current[i] = el
              }}
              src={eye.src}
              alt=""
              draggable={false}
              className="absolute will-change-transform"
              style={{ left: pct(eye.x), top: pct(eye.y), width: pct(eye.size), height: pct(eye.size) }}
            />
          ))}
        </div>

        <img
          src={`${BASE}aria-lid-shadow.png`}
          alt=""
          draggable={false}
          className="pointer-events-none absolute inset-0 h-full w-full"
        />
      </div>

      {/* Readability scrims for the white text */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent md:hidden" />
      <div className="absolute inset-0 hidden bg-gradient-to-r from-black/70 via-black/30 to-transparent md:block" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/40 to-transparent" />
    </div>
  )
}
