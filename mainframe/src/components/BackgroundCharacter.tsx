import { useEffect, useRef } from 'react'

// Max drift in px as the mouse moves from screen center to edge.
const DRIFT_X = 14
const DRIFT_Y = 8
const EASE = 0.08

export default function BackgroundCharacter() {
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const img = imgRef.current
    if (!img) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const target = { x: 0, y: 0 }
    const current = { x: 0, y: 0 }
    let raf = 0

    const onMouseMove = (e: MouseEvent) => {
      target.x = (e.clientX / window.innerWidth - 0.5) * 2
      target.y = (e.clientY / window.innerHeight - 0.5) * 2
    }

    const tick = () => {
      current.x += (target.x - current.x) * EASE
      current.y += (target.y - current.y) * EASE
      img.style.transform = `translate3d(${current.x * DRIFT_X}px, ${current.y * DRIFT_Y}px, 0) scale(1.04)`
      raf = requestAnimationFrame(tick)
    }

    window.addEventListener('mousemove', onMouseMove)
    raf = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-[#c9ccd4]" aria-hidden="true">
      <img
        ref={imgRef}
        src={`${import.meta.env.BASE_URL}aria.webp`}
        alt=""
        draggable={false}
        className="absolute bottom-0 left-1/2 h-full w-auto max-w-none -translate-x-1/2 select-none md:left-auto md:right-[-14%] xl:right-[4%] md:translate-x-0"
        style={{
          transform: 'scale(1.04)',
          transformOrigin: 'center bottom',
          maskImage: 'linear-gradient(to right, transparent 0%, #000 10%, #000 90%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, #000 10%, #000 90%, transparent 100%)',
        }}
      />
      {/* Readability scrims for the white text */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent md:hidden" />
      <div className="absolute inset-0 hidden bg-gradient-to-r from-black/70 via-black/30 to-transparent md:block" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/40 to-transparent" />
    </div>
  )
}
