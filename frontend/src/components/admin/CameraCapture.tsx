import { useState } from 'react'
import { useCamera } from '../../hooks/useCamera'
import cameraIcon from '../../assets/icons/camera.svg'

type CameraCaptureProps = {
  onCapture: (image: Blob) => void
  onCancel: () => void
}

/** Vídeo da câmera com botões para capturar o quadro atual ou desistir. */
export default function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const { videoRef, status, capture } = useCamera()
  const [busy, setBusy] = useState(false)

  const handleCapture = async () => {
    setBusy(true)
    const image = await capture()
    setBusy(false)
    if (image) onCapture(image)
  }

  return (
    <div className="camera-capture">
      <div className="camera-capture__frame">
        <video
          ref={videoRef}
          className="camera-capture__video"
          autoPlay
          muted
          playsInline
        />
        {status !== 'ready' && (
          <p className="camera-capture__status">
            {status === 'error'
              ? 'Câmera indisponível. Permita o acesso à câmera no navegador.'
              : 'Abrindo a câmera…'}
          </p>
        )}
      </div>
      <div className="form-row form-row--tight">
        <button type="button" className="button button--grow" onClick={onCancel}>
          Cancelar
        </button>
        <button
          type="button"
          className="button button--primary button--grow"
          disabled={status !== 'ready' || busy}
          onClick={handleCapture}
        >
          <img src={cameraIcon} alt="" className="button__icon--inverted" />
          Capturar
        </button>
      </div>
    </div>
  )
}
