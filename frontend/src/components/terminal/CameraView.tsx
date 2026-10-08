import type { ReactNode, Ref } from 'react'
import videoIcon from '../../assets/icons/video.svg'

type CameraViewProps = {
  /** Vídeo ao vivo da câmera; quando ausente, exibe o fundo escuro sem imagem. */
  videoRef?: Ref<HTMLVideoElement>
  statusIcon: string
  statusLabel: string
  instructionIcon: string
  instruction: string
  caption: string
  /** Elementos sobrepostos à imagem (guia facial, selo de validação etc.). */
  children?: ReactNode
}

export default function CameraView({
  videoRef,
  statusIcon,
  statusLabel,
  instructionIcon,
  instruction,
  caption,
  children,
}: CameraViewProps) {
  return (
    <div className={`camera ${videoRef ? '' : 'camera--empty'}`}>
      {videoRef && (
        <>
          <video
            ref={videoRef}
            className="camera__preview camera__preview--mirrored"
            autoPlay
            muted
            playsInline
          />
          <div className="camera__contrast" />
        </>
      )}

      <div className="camera__status">
        <img src={statusIcon} alt="" />
        <span>{statusLabel}</span>
      </div>

      <div className="camera__capture" title="Captura de vídeo ativa">
        <img src={videoIcon} alt="" />
      </div>

      {children}

      <div className="camera__bar">
        <div className="camera__instruction">
          <img src={instructionIcon} alt="" />
          <span>{instruction}</span>
        </div>
        <span className="camera__caption">{caption}</span>
      </div>
    </div>
  )
}
