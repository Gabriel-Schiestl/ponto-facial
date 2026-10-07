import { useEffect, useMemo, useState } from 'react'
import { listPunches, type Punch, type PunchType } from '../../api'
import { formatTimeWithSeconds } from '../../hooks/useNow'
import Avatar from '../../components/Avatar'
import clock3 from '../../assets/icons/clock-3.svg'
import userCheck from '../../assets/icons/user-check.svg'
import timerIcon from '../../assets/icons/timer.svg'
import searchIcon from '../../assets/icons/search.svg'
import calendarDays from '../../assets/icons/calendar-days.svg'
import infoIcon from '../../assets/icons/info-16.svg'

const typeTone: Record<PunchType, string> = {
  entrada: 'pill--primary',
  saida_intervalo: 'pill--warning',
  retorno_intervalo: 'pill--warning',
  saida: 'pill--neutral',
}

/** Data local no formato `AAAA-MM-DD`, usado pelo `<input type="date">` e pela API. */
const today = () => {
  const now = new Date()
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

export default function RegistrosPonto() {
  const [day, setDay] = useState(today)
  const [query, setQuery] = useState('')
  const [punches, setPunches] = useState<Punch[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!day) return
    const controller = new AbortController()
    listPunches(day, controller.signal)
      .then((data) => {
        setPunches(data)
        setError('')
      })
      .catch((reason) => {
        if (!controller.signal.aborted) setError(reason.message)
      })
    return () => controller.abort()
  }, [day])

  // Mais recentes primeiro; a busca filtra os registros já carregados do dia.
  const visible = useMemo(() => {
    const term = query.trim().toLowerCase()
    return [...(punches ?? [])]
      .reverse()
      .filter(
        ({ employee }) =>
          !term ||
          employee.name.toLowerCase().includes(term) ||
          employee.id.toLowerCase().includes(term),
      )
  }, [punches, query])

  const all = punches ?? []
  const last = all[all.length - 1]
  const stats = [
    {
      label: 'Registros no dia',
      value: punches ? all.length : '–',
      detail: 'Entradas, intervalos e saídas',
      icon: clock3,
    },
    {
      label: 'Funcionários com registro',
      value: punches ? new Set(all.map((punch) => punch.employee.id)).size : '–',
      detail: `${all.filter((punch) => punch.type === 'entrada').length} entradas registradas`,
      icon: userCheck,
    },
    {
      label: 'Último registro',
      value: last ? formatTimeWithSeconds(new Date(last.registeredAt)) : '–',
      detail: last ? `${last.employee.name} · ${last.typeLabel}` : 'Nenhum registro no dia',
      icon: timerIcon,
    },
  ]

  return (
    <main className="admin-content">
      <section className="page-heading">
        <div className="page-heading__text">
          <h1 className="page-heading__title">Registros de ponto</h1>
          <p className="page-heading__subtitle">
            Acompanhe os pontos registrados pelo reconhecimento facial.
          </p>
        </div>
      </section>

      <section className="stats">
        {stats.map((stat) => (
          <article key={stat.label} className="card stat">
            <div className="stat__data">
              <p className="stat__label">{stat.label}</p>
              <p className="stat__value">{stat.value}</p>
              <p className="stat__detail">{stat.detail}</p>
            </div>
            <span className="stat__symbol">
              <img src={stat.icon} alt="" />
            </span>
          </article>
        ))}
      </section>

      <section className="card directory">
        <div className="directory__filters">
          <label className="search">
            <img src={searchIcon} alt="" />
            <input
              type="search"
              placeholder="Buscar por nome ou matrícula"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Buscar por nome ou matrícula"
            />
          </label>

          <label className="search search--date">
            <img src={calendarDays} alt="" />
            <input
              type="date"
              value={day}
              max={today()}
              onChange={(event) => setDay(event.target.value)}
              aria-label="Data dos registros"
            />
          </label>
        </div>

        <div className="table table--punches" role="table" aria-label="Registros de ponto">
          <div className="table__row table__row--head" role="row">
            <span role="columnheader">FUNCIONÁRIO</span>
            <span role="columnheader">TIPO</span>
            <span role="columnheader">HORÁRIO</span>
            <span role="columnheader">COMPROVANTE</span>
            <span role="columnheader">TERMINAL</span>
          </div>

          {visible.map((punch) => (
            <div key={punch.id} className="table__row" role="row">
              <div className="identity" role="cell">
                <Avatar
                  className="identity__photo"
                  name={punch.employee.name}
                  photo={punch.employee.photo}
                />
                <div className="cell-stack">
                  <span className="identity__name">{punch.employee.name}</span>
                  <span className="identity__id">
                    {punch.employee.id} · {punch.employee.department}
                  </span>
                </div>
              </div>
              <div role="cell">
                <span className={`pill ${typeTone[punch.type]}`}>{punch.typeLabel}</span>
              </div>
              <div className="cell-stack" role="cell">
                <time className="cell-stack__main" dateTime={punch.registeredAt}>
                  {formatTimeWithSeconds(new Date(punch.registeredAt))}
                </time>
              </div>
              <div className="cell-stack" role="cell">
                <span className="cell-stack__sub">{punch.receipt}</span>
              </div>
              <div className="cell-stack" role="cell">
                <span className="cell-stack__main">{punch.terminal ?? '–'}</span>
                <span className="cell-stack__sub">{punch.location ?? ''}</span>
              </div>
            </div>
          ))}

          {error ? (
            <p className="table__empty">{error}</p>
          ) : (
            punches &&
            visible.length === 0 && (
              <p className="table__empty">
                {all.length === 0
                  ? 'Nenhum ponto registrado nesta data.'
                  : 'Nenhum registro encontrado com a busca atual.'}
              </p>
            )
          )}
        </div>
      </section>

      <p className="footnote">
        <img src={infoIcon} alt="" />
        O tipo de cada registro segue a sequência do dia: entrada, saída para intervalo, retorno
        do intervalo e saída.
      </p>
    </main>
  )
}
