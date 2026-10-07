import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { departments } from '../../data/employees'
import juliaMartins from '../../assets/images/julia-martins.jpg'
import arrowLeft from '../../assets/icons/arrow-left.svg'
import userRound from '../../assets/icons/user-round.svg'
import briefcase from '../../assets/icons/briefcase-business.svg'
import imageIcon from '../../assets/icons/image.svg'
import checkSuccess from '../../assets/icons/check-14-success.svg'
import cameraIcon from '../../assets/icons/camera.svg'
import uploadIcon from '../../assets/icons/upload.svg'
import scanFace20 from '../../assets/icons/scan-face-20.svg'
import scanFace28 from '../../assets/icons/scan-face-28.svg'
import checkPrimary from '../../assets/icons/check-14-primary.svg'
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

function Select({ defaultValue, options }: { defaultValue: string; options: string[] }) {
  return (
    <span className="input input--select">
      <select defaultValue={defaultValue}>
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

type Photo = { url: string; name: string; detail: string }

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`

export default function CadastroFuncionario() {
  const navigate = useNavigate()
  const fileInput = useRef<HTMLInputElement>(null)
  const [consent, setConsent] = useState(true)
  const [photo, setPhoto] = useState<Photo>({
    url: juliaMartins,
    name: 'julia-martins.jpg',
    detail: 'JPG · 420 KB',
  })

  useEffect(() => {
    return () => {
      if (photo.url.startsWith('blob:')) URL.revokeObjectURL(photo.url)
    }
  }, [photo.url])

  const handleFile = (file: File | undefined) => {
    if (!file) return
    const extension = file.name.split('.').pop()?.toUpperCase() ?? ''
    setPhoto({
      url: URL.createObjectURL(file),
      name: file.name,
      detail: `${extension} · ${formatSize(file.size)}`,
    })
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    navigate('/admin/funcionarios')
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
              <input className="input" name="nome" defaultValue="Júlia Martins" required />
            </Field>

            <div className="form-row">
              <Field label="CPF" required>
                <input className="input" name="cpf" defaultValue="000.000.000-00" required />
              </Field>
              <Field label="Matrícula" required>
                <input className="input" name="matricula" defaultValue="HT-049" required />
              </Field>
            </div>

            <Field label="E-mail corporativo" required>
              <input
                className="input"
                type="email"
                name="email"
                defaultValue="julia.martins@horizonte.example"
                required
              />
            </Field>

            <div className="form-row">
              <Field label="Telefone">
                <input className="input" type="tel" name="telefone" defaultValue="(11) 90000-0049" />
              </Field>
              <Field label="Data de admissão" required>
                <span className="input input--select">
                  <input name="admissao" defaultValue="07/10/2026" required />
                  <img src={chevronDown} alt="" />
                </span>
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
                <Select defaultValue="Produto" options={departments} />
              </Field>
              <Field label="Cargo" required>
                <input className="input" name="cargo" defaultValue="Analista de produto" required />
              </Field>
            </div>

            <div className="form-row">
              <Field label="Unidade" required>
                <Select defaultValue="São Paulo" options={['São Paulo', 'Rio de Janeiro']} />
              </Field>
              <Field label="Status">
                <Select defaultValue="Ativo" options={['Ativo', 'Inativo']} />
              </Field>
            </div>

            <Field
              label="Jornada de trabalho"
              required
              hint="Intervalo de 1 hora · Carga horária de 40 horas semanais."
            >
              <Select
                defaultValue="Segunda a sexta · 08:00 às 17:00"
                options={['Segunda a sexta · 08:00 às 17:00', 'Segunda a sexta · 09:00 às 18:00']}
              />
            </Field>
          </section>

          <p className="form-note">* Campos obrigatórios. Dados fictícios para demonstração.</p>
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

            <div className="photo">
              <img className="photo__image" src={photo.url} alt="Foto de cadastro selecionada" />
              <div className="photo__file">
                <p className="photo__name">{photo.name}</p>
                <p className="photo__detail">{photo.detail}</p>
                <p className="photo__state">
                  <img src={checkSuccess} alt="" />
                  Foto selecionada
                </p>
              </div>
            </div>

            <div className="form-row form-row--tight">
              <button type="button" className="button button--grow">
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
                onChange={(event) => handleFile(event.target.files?.[0])}
              />
            </div>

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

            <div className="quality">
              <div className="quality__result">
                <img src={scanFace28} alt="" />
                <div>
                  <p className="quality__title">Face validada</p>
                  <p className="quality__detail">Captura pronta para salvar</p>
                </div>
              </div>
              {qualityChecks.map((check) => (
                <p key={check} className="quality__check">
                  <img src={checkPrimary} alt="" />
                  {check}
                </p>
              ))}
            </div>

            <button type="button" className="button button--block">
              <img src={cameraIcon} alt="" />
              Refazer captura facial
            </button>

            <label className="consent">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                required
              />
              <span className="consent__box" aria-hidden="true">
                <img src={checkWhite12} alt="" />
              </span>
              <span>
                Funcionária informada sobre o uso dos dados faciais exclusivamente para controle
                de ponto.
              </span>
            </label>
          </section>
        </div>
      </form>

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
          <button type="submit" form="cadastro" className="button button--primary">
            <img src={checkWhite18} alt="" />
            Salvar funcionário
          </button>
        </div>
      </div>
    </main>
  )
}
