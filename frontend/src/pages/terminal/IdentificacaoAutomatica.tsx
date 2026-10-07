import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ApiError, registerPunch } from '../../api'
import { terminal } from '../../config/terminal'
import { useCamera } from '../../hooks/useCamera'
import TerminalLayout from '../../components/terminal/TerminalLayout'
import CameraView from '../../components/terminal/CameraView'
import Notice from '../../components/terminal/Notice'
import dotCamera from '../../assets/icons/dot-camera.svg'
import faceGuide from '../../assets/icons/face-guide.svg'
import scanFaceCamera from '../../assets/icons/scan-face-camera.svg'
import scanFace24 from '../../assets/icons/scan-face-24.svg'
import sunIcon from '../../assets/icons/sun-16.svg'
import handIcon from '../../assets/icons/hand.svg'
import focusIcon from '../../assets/icons/focus.svg'
import infoIcon from '../../assets/icons/info-22.svg'

/** Intervalo entre leituras enquanto ninguém é identificado. */
const SCAN_INTERVAL_MS = 1500
/** Pausa após um aviso (sem conexão, registros do dia completos) antes de ler de novo. */
const NOTICE_PAUSE_MS = 5000

type Waiting = { title: string; description: string; warning?: boolean }

const idle: Waiting = {
  title: 'Aguardando identificação',
  description: 'O registro será feito automaticamente.',
}

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms))

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
  const { videoRef, status: cameraStatus, capture } = useCamera()
  const [waiting, setWaiting] = useState(idle)
  const [online, setOnline] = useState(true)

  // Envia um quadro por vez ao backend até alguém ser identificado.
  useEffect(() => {
    if (cameraStatus !== 'ready') return
    let active = true

    const scan = async () => {
      while (active) {
        const image = await capture()
        if (!image) {
          await sleep(SCAN_INTERVAL_MS)
          continue
        }

        try {
          const punch = await registerPunch(image, terminal.name, terminal.location)
          if (!active) return
          navigate('/ponto/confirmado', { state: { punch } })
          return
        } catch (error) {
          if (!active) return
          const status = error instanceof ApiError ? error.status : 0
          if (status === 404) {
            navigate('/ponto/nao-reconhecido')
            return
          }

          setOnline(status !== 0)
          if (status === 422) {
            // Nenhum rosto na imagem: continua tentando.
            setWaiting(idle)
            await sleep(SCAN_INTERVAL_MS)
            continue
          }

          setWaiting({
            title: status === 409 ? 'Registros de hoje concluídos' : 'Não foi possível registrar',
            description: error instanceof Error ? error.message : 'Tente novamente.',
            warning: true,
          })
          await sleep(NOTICE_PAUSE_MS)
          if (active) setWaiting(idle)
        }
      }
    }

    void scan()
    return () => {
      active = false
    }
  }, [cameraStatus, capture, navigate])

  const cameraUnavailable = cameraStatus === 'error'
  const current: Waiting = cameraUnavailable
    ? {
        title: 'Câmera indisponível',
        description: 'Permita o acesso à câmera neste navegador e recarregue a página.',
        warning: true,
      }
    : waiting

  return (
    <TerminalLayout
      online={online}
      title="Registre seu ponto com o rosto"
      subtitle="Sem matrícula, sem senha. Basta olhar para a câmera e aguardar a confirmação."
    >
      <div className="terminal-grid">
        <div className="capture">
          <CameraView
            videoRef={videoRef}
            statusIcon={dotCamera}
            statusLabel={cameraUnavailable ? 'Câmera indisponível' : 'Câmera ativa'}
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

          <div className={`waiting ${current.warning ? 'waiting--warning' : ''}`} role="status">
            <img className="waiting__icon" src={focusIcon} alt="" />
            <div>
              <p className="waiting__title">{current.title}</p>
              <p className="waiting__description">{current.description}</p>
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
