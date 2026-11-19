import { useEffect, useRef } from 'react'

const VIDEO_SRC =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260826_041744_63efcd78-bf7d-4039-99e2-2461e8a61903.mp4'
const SENSITIVITY = 0.8

export default function BackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const targetTime = useRef(0)
  const seeking = useRef(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let prevX: number | null = null

    const seek = () => {
      if (Math.abs(video.currentTime - targetTime.current) < 0.001) return
      seeking.current = true
      video.currentTime = targetTime.current
    }

    const onSeeked = () => {
      seeking.current = false
      // Target moved while we were seeking: queue the next seek.
      if (Math.abs(video.currentTime - targetTime.current) > 0.001) seek()
    }

    const onMouseMove = (e: MouseEvent) => {
      const currentX = e.clientX
      if (prevX === null) {
        prevX = currentX
        return
      }
      const delta = currentX - prevX
      prevX = currentX

      const duration = video.duration
      if (!duration || !Number.isFinite(duration)) return

      const offset = (delta / window.innerWidth) * SENSITIVITY * duration
      targetTime.current = Math.min(duration, Math.max(0, targetTime.current + offset))

      if (!seeking.current) seek()
    }

    video.addEventListener('seeked', onSeeked)
    window.addEventListener('mousemove', onMouseMove)
    return () => {
      video.removeEventListener('seeked', onSeeked)
      window.removeEventListener('mousemove', onMouseMove)
    }
  }, [])

  return (
    <video
      ref={videoRef}
      src={VIDEO_SRC}
      muted
      playsInline
      preload="auto"
      className="fixed inset-0 z-0 h-full w-full object-cover"
      style={{ objectPosition: '70% center' }}
    />
  )
}
