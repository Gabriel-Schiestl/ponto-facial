import { useNavigate } from 'react-router-dom'
import TerminalLayout from '../../components/terminal/TerminalLayout'
import CameraView from '../../components/terminal/CameraView'
import Notice from '../../components/terminal/Notice'
import dotCamera from '../../assets/icons/dot-camera.svg'
import faceGuideDashed from '../../assets/images/face-guide-dashed.png'
import scanFacePlaceholder from '../../assets/icons/scan-face-placeholder.svg'
import scanFaceCamera from '../../assets/icons/scan-face-camera.svg'
import scanFaceWarning from '../../assets/icons/scan-face-warning.svg'
import scanFace20 from '../../assets/icons/scan-face-20.svg'
import shieldCheck from '../../assets/icons/shield-check-16.svg'
import sunIcon from '../../assets/icons/sun-20.svg'
import eyeIcon from '../../assets/icons/eye.svg'
import rotateCcw from '../../assets/icons/rotate-ccw.svg'
import userRoundCog from '../../assets/icons/user-round-cog.svg'

const recommendations = [
  { icon: scanFace20, text: 'Fique de frente e centralize o rosto na marcação.' },
  { icon: sunIcon, text: 'Procure boa iluminação e evite luz atrás de você.' },
  { icon: eyeIcon, text: 'Deixe o rosto visível, sem máscara ou óculos escuros.' },
]

export default function FaceNaoReconhecida() {
  const navigate = useNavigate()

  return (
    <TerminalLayout
      title="Não reconhecemos seu rosto"
      subtitle="Seu ponto ainda não foi registrado. Ajuste sua posição e tente novamente."
    >
      <div className="terminal-grid">
        <div className="capture">
          <CameraView
            statusIcon={dotCamera}
            statusLabel="Câmera pronta para nova tentativa"
            instructionIcon={scanFaceCamera}
            instruction="Posicione seu rosto para uma nova leitura"
            caption="Captura automática"
          >
            <img className="camera__guide" src={faceGuideDashed} width={266} height={338} alt="" />
            <img className="camera__placeholder" src={scanFacePlaceholder} alt="" />
          </CameraView>

          <div className="capture__footer">
            <span className="capture__hint">
              <img src={shieldCheck} alt="" />
              Imagem da tentativa não exibida por privacidade
            </span>
            <span className="pill pill--warning">Nenhum ponto registrado</span>
          </div>
        </div>

        <aside className="panel">
          <div className="panel__result">
            <span className="panel__result-symbol panel__result-symbol--warning">
              <img src={scanFaceWarning} alt="" />
            </span>
            <div>
              <h2 className="panel__title">Face não reconhecida</h2>
              <p className="panel__result-detail panel__result-detail--warning">
                Não encontramos uma identificação.
              </p>
            </div>
          </div>
          <div className="divider" />

          <p className="panel__subtitle">Vamos tentar mais uma vez?</p>

          <ul className="recommendations">
            {recommendations.map((item) => (
              <li key={item.text} className="recommendation">
                <img src={item.icon} alt="" />
                <span>{item.text}</span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            className="button button--primary button--block"
            onClick={() => navigate('/ponto')}
          >
            <img src={rotateCcw} alt="" />
            Tentar novamente
          </button>

          <p className="panel__help">
            Se o problema continuar, procure o administrador para verificar seu cadastro facial.
          </p>
        </aside>
      </div>

      <Notice
        tone="warning"
        icon={userRoundCog}
        title="Primeiro acesso ou cadastro desatualizado?"
        description="O administrador precisa configurar sua identificação facial antes do primeiro registro."
        aside={<span className="notice__aside">Procure o RH na recepção</span>}
      />
    </TerminalLayout>
  )
}
