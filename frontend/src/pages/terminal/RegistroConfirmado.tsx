import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import type { Punch } from '../../api'
import { useCamera } from '../../hooks/useCamera'
import Avatar from '../../components/Avatar'
import TerminalLayout from '../../components/terminal/TerminalLayout'
import CameraView from '../../components/terminal/CameraView'
import Notice from '../../components/terminal/Notice'
import { formatLongDate, formatTimeWithSeconds } from '../../hooks/useNow'
import dotCameraSuccess from '../../assets/icons/dot-camera-success.svg'
import dotSuccess from '../../assets/icons/dot-success.svg'
import faceGuideSuccess from '../../assets/icons/face-guide-success.svg'
import checkWhite from '../../assets/icons/check-16-white.svg'
import checkSuccess from '../../assets/icons/check-24-success.svg'
import shieldCheckCamera from '../../assets/icons/shield-check-camera.svg'
import shieldCheckSuccess from '../../assets/icons/shield-check-success.svg'
import calendarDays from '../../assets/icons/calendar-days.svg'
import checkCircle from '../../assets/icons/check-circle.svg'
import timerIcon from '../../assets/icons/timer.svg'

const RETURN_SECONDS = 5

export default function RegistroConfirmado() {
  const location = useLocation()
  const punch = (location.state as { punch?: Punch } | null)?.punch

  // Sem registro (acesso direto ou recarga da página), volta para a leitura.
  if (!punch) return <Navigate to="/ponto" replace />
  return <Confirmacao punch={punch} />
}

function Confirmacao({ punch }: { punch: Punch }) {
  const navigate = useNavigate()
  const { videoRef } = useCamera()
  const [secondsLeft, setSecondsLeft] = useState(RETURN_SECONDS)
  const { employee } = punch
  const registeredAt = new Date(punch.registeredAt)

  useEffect(() => {
    if (secondsLeft <= 0) {
      navigate('/ponto', { replace: true })
      return
    }
    const id = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => window.clearTimeout(id)
  }, [secondsLeft, navigate])

  return (
    <TerminalLayout
      title="Ponto registrado. Bom trabalho!"
      subtitle="Identificação concluída. Confira abaixo os dados do seu registro."
    >
      <div className="terminal-grid">
        <div className="capture">
          <CameraView
            videoRef={videoRef}
            statusIcon={dotCameraSuccess}
            statusLabel="Identificação concluída"
            instructionIcon={shieldCheckCamera}
            instruction="Reconhecimento facial validado"
            caption="Concluído"
          >
            <img className="camera__guide" src={faceGuideSuccess} alt="" />
            <div className="camera__recognized">
              <img src={checkWhite} alt="" />
              {employee.name}
            </div>
          </CameraView>

          <div className="capture__footer">
            <span className="capture__hint">
              <img src={shieldCheckSuccess} alt="" />
              Identidade confirmada por reconhecimento facial
            </span>
            <span className="pill pill--success">
              <img src={dotSuccess} alt="" />
              Registro salvo
            </span>
          </div>
        </div>

        <aside className="panel">
          <div className="panel__result">
            <span className="panel__result-symbol panel__result-symbol--success">
              <img src={checkSuccess} alt="" />
            </span>
            <div>
              <h2 className="panel__title">Ponto registrado</h2>
              <p className="panel__result-detail panel__result-detail--success">
                {punch.duplicate
                  ? 'Este registro já havia sido feito há instantes.'
                  : 'Tudo certo com seu registro.'}
              </p>
            </div>
          </div>
          <div className="divider" />

          <div className="employee">
            <Avatar
              className="employee__photo"
              name={employee.name}
              photo={employee.photo}
              alt={`Foto de ${employee.name}`}
            />
            <div className="employee__data">
              <p className="employee__name">{employee.name}</p>
              <p className="employee__meta">
                {employee.id} · {employee.department}
              </p>
              <p className="employee__meta">{employee.role}</p>
            </div>
          </div>

          <div className="punch">
            <div className="punch__type">
              <span>Tipo de registro</span>
              <span className="pill pill--primary">{punch.typeLabel}</span>
            </div>
            <time className="punch__time" dateTime={punch.registeredAt}>
              {formatTimeWithSeconds(registeredAt)}
            </time>
            <div className="punch__date">
              <img src={calendarDays} alt="" />
              {formatLongDate(registeredAt)}
            </div>
          </div>

          <div className="receipt">
            <span>Comprovante nº {punch.receipt}</span>
            <img src={shieldCheckSuccess} alt="" />
          </div>
          <p className="receipt">
            {[punch.location, punch.terminal].filter(Boolean).join(' · ')}
          </p>
        </aside>
      </div>

      <Notice
        tone="success"
        icon={checkCircle}
        title="Você já pode se afastar da câmera."
        description="O terminal ficará disponível para o próximo funcionário automaticamente."
        aside={
          <span className="notice__aside" aria-live="polite">
            <img src={timerIcon} alt="" />
            Nova leitura em {secondsLeft} s
          </span>
        }
      />
    </TerminalLayout>
  )
}
