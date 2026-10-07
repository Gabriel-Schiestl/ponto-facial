import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError, createEmployee, validateFace, type FaceValidation } from '../../api'
import { departments, schedules, units } from '../../data/employees'
import CameraCapture from '../../components/admin/CameraCapture'
import arrowLeft from '../../assets/icons/arrow-left.svg'
import userRound from '../../assets/icons/user-round.svg'
import briefcase from '../../assets/icons/briefcase-business.svg'
import imageIcon from '../../assets/icons/image.svg'
import checkSuccess from '../../assets/icons/check-14-success.svg'
import cameraIcon from '../../assets/icons/camera.svg'
import uploadIcon from '../../assets/icons/upload.svg'
import scanFace20 from '../../assets/icons/scan-face-20.svg'
import scanFace28 from '../../assets/icons/scan-face-28.svg'
import scanFaceWarning from '../../assets/icons/scan-face-warning.svg'
import checkPrimary from '../../assets/icons/check-14-primary.svg'
import dotWarning from '../../assets/icons/dot-warning.svg'
import checkWhite12 from '../../assets/icons/check-12-white.svg'
import shieldCheck from '../../assets/icons/shield-check-18.svg'
import checkWhite18 from '../../assets/icons/check-18-white.svg'
import chevronDown from '../../assets/icons/chevron-down-16.svg'

type FieldProps = {
  label: string
  required?: boolean
  hint?: string
  children: ReactNode
}

function Field({ label, required, hint, children }: FieldProps) {
  return (
    <label className="field">
      <span className="field__label">
        {label}
        {required && ' *'}
      </span>
      {children}
      {hint && <span className="field__hint">{hint}</span>}
    </label>
  )
}

function Select({ name, options }: { name: string; options: string[] }) {
  return (
    <span className="input input--select">
      <select name={name} defaultValue={options[0]}>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
      <img src={chevronDown} alt="" />
    </span>
  )
}

const qualityChecks = [
  'Um único rosto detectado',
  'Iluminação e nitidez adequadas',
  'Rosto de frente, sem obstruções',
]

const MAX_PHOTO_BYTES = 5 * 1024 * 1024

type Photo = { url: string; name: string; detail: string; file: Blob }

/** Captura facial: sem captura, abrindo a câmera, validando ou já validada pelo backend. */
type FaceCapture =
  | { state: 'empty' }
  | { state: 'camera' }
  | { state: 'validating' }
  | { state: 'done'; image: Blob; validation: FaceValidation }

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`

const today = () => {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

export default function CadastroFuncionario() {
  const navigate = useNavigate()
  const fileInput = useRef<HTMLInputElement>(null)
  const [consent, setConsent] = useState(false)
  const [photo, setPhoto] = useState<Photo | null>(null)
  const [photoCamera, setPhotoCamera] = useState(false)
  const [face, setFace] = useState<FaceCapture>({ state: 'empty' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const faceValid = face.state === 'done' && face.validation.valid

  useEffect(() => {
    return () => {
      if (photo) URL.revokeObjectURL(photo.url)
    }
  }, [photo])

  const selectPhoto = (file: Blob, name: string) => {
    if (file.size > MAX_PHOTO_BYTES) {
      setError('A foto de cadastro deve ter até 5 MB.')
      return
    }
    const extension = name.split('.').pop()?.toUpperCase() ?? ''
    setError('')
    setPhoto({
      url: URL.createObjectURL(file),
      name,
      detail: `${extension} · ${formatSize(file.size)}`,
      file,
    })
  }

  const handleFaceCapture = async (image: Blob) => {
    setFace({ state: 'validating' })
    try {
      setFace({ state: 'done', image, validation: await validateFace(image) })
    } catch (reason) {
      setFace({ state: 'empty' })
      setError(reason instanceof Error ? reason.message : 'Não foi possível validar a captura.')
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    if (photo) form.append('foto', photo.file, photo.name)
    if (faceValid) form.append('face', face.image, 'face.jpg')
    form.append('consentimento', String(faceValid && consent))

    setSaving(true)
    setError('')
    try {
      await createEmployee(form)
      navigate('/admin/funcionarios')
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Não foi possível salvar o cadastro.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="admin-content admin-content--form">
      <Link to="/admin/funcionarios" className="back-link focus-ring">
        <img src={arrowLeft} alt="" />
        Voltar para funcionários
      </Link>

      <section className="page-heading">
        <div className="page-heading__text page-heading__text--tight">
          <h1 className="page-heading__title">Cadastrar funcionário</h1>
          <p className="page-heading__subtitle">
            Preencha os dados e prepare a identificação facial para o registro de ponto.
          </p>
        </div>
        <span className="pill pill--neutral">Novo cadastro</span>
      </section>

      <form id="cadastro" className="register" onSubmit={handleSubmit}>
        <div className="register__main">
          <section className="card form-card">
            <h2 className="form-card__heading">
              <img src={userRound} alt="" />
              Dados pessoais
            </h2>

            <Field label="Nome completo" required>
              <input className="input" name="nome" placeholder="Júlia Martins" minLength={3} required />
            </Field>

            <div className="form-row">
              <Field label="CPF" required>
                <input
                  className="input"
                  name="cpf"
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                  pattern="\d{3}\.?\d{3}\.?\d{3}-?\d{2}"
                  title="Informe os 11 dígitos do CPF."
                  required
                />
              </Field>
              <Field label="Matrícula" required>
                <input
                  className="input"
                  name="matricula"
                  placeholder="HT-049"
                  pattern="[A-Za-z0-9\-]{1,20}"
                  title="Use letras, números e hífen."
                  required
                />
              </Field>
            </div>

            <Field label="E-mail corporativo" required>
              <input
                className="input"
                type="email"
                name="email"
                placeholder="julia.martins@horizonte.example"
                required
              />
            </Field>

            <div className="form-row">
              <Field label="Telefone">
                <input className="input" type="tel" name="telefone" placeholder="(11) 90000-0000" />
              </Field>
              <Field label="Data de admissão" required>
                <input className="input" type="date" name="admissao" defaultValue={today()} required />
              </Field>
            </div>
          </section>

          <section className="card form-card">
            <h2 className="form-card__heading">
              <img src={briefcase} alt="" />
              Vínculo e jornada
            </h2>

            <div className="form-row">
              <Field label="Departamento" required>
                <Select name="departamento" options={departments} />
              </Field>
              <Field label="Cargo" required>
                <input className="input" name="cargo" placeholder="Analista de produto" required />
              </Field>
            </div>

            <div className="form-row">
              <Field label="Unidade" required>
                <Select name="unidade" options={units} />
              </Field>
              <Field label="Status">
                <Select name="status" options={['Ativo', 'Inativo']} />
              </Field>
            </div>

            <Field
              label="Jornada de trabalho"
              required
              hint="Intervalo de 1 hora · Carga horária de 40 horas semanais."
            >
              <Select name="jornada" options={schedules} />
            </Field>
          </section>

          <p className="form-note">* Campos obrigatórios.</p>
        </div>

        <div className="register__aside">
          <section className="card form-card form-card--compact">
            <h2 className="form-card__heading">
              <img src={imageIcon} alt="" />
              Foto de cadastro
            </h2>
            <p className="form-card__text">
              Exibida no perfil e na lista de funcionários. Esta foto não substitui a captura
              facial.
            </p>

            {photoCamera ? (
              <CameraCapture
                onCapture={(image) => {
                  selectPhoto(image, 'captura-camera.jpg')
                  setPhotoCamera(false)
                }}
                onCancel={() => setPhotoCamera(false)}
              />
            ) : (
              <>
                <div className="photo">
                  {photo ? (
                    <img className="photo__image" src={photo.url} alt="Foto de cadastro selecionada" />
                  ) : (
                    <span className="photo__placeholder" />
                  )}
                  <div className="photo__file">
                    <p className="photo__name">{photo ? photo.name : 'Nenhuma foto selecionada'}</p>
                    <p className="photo__detail">{photo ? photo.detail : 'Opcional'}</p>
                    {photo && (
                      <p className="photo__state">
                        <img src={checkSuccess} alt="" />
                        Foto selecionada
                      </p>
                    )}
                  </div>
                </div>

                <div className="form-row form-row--tight">
                  <button
                    type="button"
                    className="button button--grow"
                    disabled={face.state === 'camera'}
                    onClick={() => setPhotoCamera(true)}
                  >
                    <img src={cameraIcon} alt="" />
                    Capturar foto
                  </button>
                  <button
                    type="button"
                    className="button button--grow"
                    onClick={() => fileInput.current?.click()}
                  >
                    <img src={uploadIcon} alt="" />
                    Enviar foto
                  </button>
                  <input
                    ref={fileInput}
                    type="file"
                    accept="image/jpeg,image/png"
                    hidden
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) selectPhoto(file, file.name)
                      event.target.value = ''
                    }}
                  />
                </div>
              </>
            )}

            <p className="form-card__hint">JPG ou PNG, até 5 MB. Use uma foto nítida e de frente.</p>
          </section>

          <section className="card form-card form-card--compact">
            <h2 className="form-card__heading">
              <img src={scanFace20} alt="" />
              Identificação facial
            </h2>
            <p className="form-card__text">
              Uma captura pela câmera cria a identificação usada no ponto automático.
            </p>

            {face.state === 'camera' ? (
              <CameraCapture
                onCapture={handleFaceCapture}
                onCancel={() => setFace({ state: 'empty' })}
              />
            ) : (
              <>
                <FaceQuality face={face} />

                <button
                  type="button"
                  className="button button--block"
                  disabled={face.state === 'validating' || photoCamera}
                  onClick={() => setFace({ state: 'camera' })}
                >
                  <img src={cameraIcon} alt="" />
                  {face.state === 'empty' ? 'Iniciar captura facial' : 'Refazer captura facial'}
                </button>
              </>
            )}

            <label className="consent">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                required={faceValid}
              />
              <span className="consent__box" aria-hidden="true">
                <img src={checkWhite12} alt="" />
              </span>
              <span>
                Funcionário(a) informado(a) sobre o uso dos dados faciais exclusivamente para
                controle de ponto.
              </span>
            </label>
          </section>
        </div>
      </form>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <div className="divider" />

      <div className="form-actions">
        <p className="form-actions__privacy">
          <img src={shieldCheck} alt="" />
          Os dados faciais têm acesso restrito à administração.
        </p>
        <div className="form-actions__buttons">
          <Link to="/admin/funcionarios" className="button">
            Cancelar
          </Link>
          <button
            type="submit"
            form="cadastro"
            className="button button--primary"
            disabled={saving || face.state === 'validating'}
          >
            <img src={checkWhite18} alt="" />
            {saving ? 'Salvando…' : 'Salvar funcionário'}
          </button>
        </div>
      </div>
    </main>
  )
}

/** Resultado da validação da captura, com os critérios exibidos na tela. */
function FaceQuality({ face }: { face: FaceCapture }) {
  if (face.state === 'done') {
    const { valid, message, checks } = face.validation
    return (
      <div className={`quality ${valid ? '' : 'quality--warning'}`}>
        <div className="quality__result">
          <img src={valid ? scanFace28 : scanFaceWarning} alt="" />
          <div>
            <p className="quality__title">{valid ? 'Face validada' : 'Captura recusada'}</p>
            <p className="quality__detail">{message}</p>
          </div>
        </div>
        {checks.map((check) => (
          <p key={check.label} className="quality__check">
            <img src={check.ok ? checkPrimary : dotWarning} alt={check.ok ? 'Atendido' : 'Não atendido'} />
            {check.label}
          </p>
        ))}
      </div>
    )
  }

  return (
    <div className="quality quality--pending">
      <div className="quality__result">
        <img src={scanFace28} alt="" />
        <div>
          <p className="quality__title">
            {face.state === 'validating' ? 'Validando captura…' : 'Captura facial pendente'}
          </p>
          <p className="quality__detail">
            {face.state === 'validating'
              ? 'Conferindo a qualidade da imagem.'
              : 'Sem captura, a identificação fica pendente.'}
          </p>
        </div>
      </div>
      {qualityChecks.map((check) => (
        <p key={check} className="quality__check">
          {check}
        </p>
      ))}
    </div>
  )
}
