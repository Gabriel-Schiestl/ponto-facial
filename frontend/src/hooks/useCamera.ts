import { useCallback, useEffect, useRef, useState } from 'react'

export type CameraStatus = 'starting' | 'ready' | 'error'

/**
 * Abre a câmera enquanto o componente estiver montado e liga o vídeo ao `videoRef`.
 * `capture()` devolve o quadro atual em JPEG, no formato esperado pela API.
 */
export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  // `mediaDevices` só existe em contexto seguro (https ou localhost).
  const [status, setStatus] = useState<CameraStatus>(() =>
    navigator.mediaDevices ? 'starting' : 'error',
  )

  useEffect(() => {
    if (!navigator.mediaDevices) return
    let stream: MediaStream | undefined
    let cancelled = false

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } })
      .then((media) => {
        if (cancelled) {
          media.getTracks().forEach((track) => track.stop())
          return
        }
        stream = media
        if (videoRef.current) videoRef.current.srcObject = media
        setStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [])

  const capture = useCallback(async (): Promise<Blob | null> => {
    const video = videoRef.current
    if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return null
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9))
  }, [])

  return { videoRef, status, capture }
}
