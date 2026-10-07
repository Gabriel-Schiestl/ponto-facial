import type { ReactNode } from 'react'
import videoIcon from '../../assets/icons/video.svg'

type CameraViewProps = {
  /** Imagem da câmera; quando ausente, exibe o fundo escuro sem imagem. */
  preview?: string
  statusIcon: string
  statusLabel: string
  instructionIcon: string
  instruction: string
  caption: string
  /** Elementos sobrepostos à imagem (guia facial, selo de validação etc.). */
  children?: ReactNode
}

export default function CameraView({
  preview,
  statusIcon,
  statusLabel,
  instructionIcon,
  instruction,
  caption,
  children,
}: CameraViewProps) {
  return (
    <div className={`camera ${preview ? '' : 'camera--empty'}`}>
      {preview && (
        <>
          <img className="camera__preview" src={preview} alt="" />
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
