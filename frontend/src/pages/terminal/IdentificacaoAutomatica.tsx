import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TerminalLayout from '../../components/terminal/TerminalLayout'
import CameraView from '../../components/terminal/CameraView'
import Notice from '../../components/terminal/Notice'
import cameraPreview from '../../assets/images/camera-preview.jpg'
import dotCamera from '../../assets/icons/dot-camera.svg'
import faceGuide from '../../assets/icons/face-guide.svg'
import scanFaceCamera from '../../assets/icons/scan-face-camera.svg'
import scanFace24 from '../../assets/icons/scan-face-24.svg'
import sunIcon from '../../assets/icons/sun-16.svg'
import handIcon from '../../assets/icons/hand.svg'
import focusIcon from '../../assets/icons/focus.svg'
import infoIcon from '../../assets/icons/info-22.svg'

/** Tempo simulado até o reconhecimento facial no protótipo. */
const SIMULATED_RECOGNITION_MS = 5000

const steps = [
  {
    title: 'Posicione seu rosto',
    description: 'Fique de frente para a câmera, dentro da marcação.',
  },
  {
    title: 'Aguarde a identificação',
    description: 'Mantenha o rosto visível e fique parado por alguns instantes.',
  },
  {
    title: 'Confira a confirmação',
    description: 'Seu nome e o horário aparecem quando o ponto for registrado.',
  },
]

export default function IdentificacaoAutomatica() {
  const navigate = useNavigate()

  useEffect(() => {
    const id = window.setTimeout(() => {
      navigate('/ponto/confirmado', { state: { registeredAt: new Date().toISOString() } })
    }, SIMULATED_RECOGNITION_MS)
    return () => window.clearTimeout(id)
  }, [navigate])

  return (
    <TerminalLayout
      title="Registre seu ponto com o rosto"
      subtitle="Sem matrícula, sem senha. Basta olhar para a câmera e aguardar a confirmação."
    >
      <div className="terminal-grid">
        <div className="capture">
          <CameraView
            preview={cameraPreview}
            statusIcon={dotCamera}
            statusLabel="Câmera ativa"
            instructionIcon={scanFaceCamera}
            instruction="Mantenha o rosto dentro da marcação"
            caption="Captura automática"
          >
            <img className="camera__guide" src={faceGuide} alt="" />
          </CameraView>

          <div className="capture__footer">
            <span className="capture__hint">
              <img src={sunIcon} alt="" />
              Boa iluminação · Um rosto por vez
            </span>
            <span className="capture__hint">
              <img src={handIcon} alt="" />
              Não é necessário tocar na tela
            </span>
          </div>
        </div>

        <aside className="panel panel--roomy">
          <div className="panel__heading">
            <img src={scanFace24} alt="" />
            <h2 className="panel__title">É simples e automático</h2>
          </div>
          <div className="divider" />

          <ol className="steps">
            {steps.map((step, index) => (
              <li key={step.title} className="step">
                <span className="step__marker">{index + 1}</span>
                <div className="step__text">
                  <p className="step__title">{step.title}</p>
                  <p className="step__description">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="waiting" role="status">
            <img className="waiting__icon" src={focusIcon} alt="" />
            <div>
              <p className="waiting__title">Aguardando identificação</p>
              <p className="waiting__description">O registro será feito automaticamente.</p>
            </div>
          </div>
        </aside>
      </div>

      <Notice
        tone="primary"
        icon={infoIcon}
        title="Seu rosto é a sua identificação."
        description="O tipo de registro é definido automaticamente pela sua sequência de pontos do dia."
        aside={<span className="pill pill--primary">Entrada · Intervalo · Saída</span>}
      />
    </TerminalLayout>
  )
}
