import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getEmployeeTotals, listEmployees, type EmployeePage, type EmployeeTotals } from '../../api'
import { departments } from '../../data/employees'
import Avatar from '../../components/Avatar'
import plusIcon from '../../assets/icons/plus.svg'
import usersIcon from '../../assets/icons/users.svg'
import userCheck from '../../assets/icons/user-check.svg'
import scanFace20 from '../../assets/icons/scan-face-20.svg'
import searchIcon from '../../assets/icons/search.svg'
import chevronDown18 from '../../assets/icons/chevron-down-18.svg'
import downloadIcon from '../../assets/icons/download.svg'
import dotPrimary from '../../assets/icons/dot-primary.svg'
import dotWarning from '../../assets/icons/dot-warning.svg'
import ellipsisIcon from '../../assets/icons/ellipsis.svg'
import chevronLeft from '../../assets/icons/chevron-left.svg'
import chevronRight16 from '../../assets/icons/chevron-right-16.svg'
import infoIcon from '../../assets/icons/info-16.svg'

const PAGE_SIZE = 10
/** Espera após a digitação antes de buscar. */
const SEARCH_DELAY_MS = 300

const buildStats = (totals: EmployeeTotals | null) => [
  {
    label: 'Funcionários cadastrados',
    value: totals?.registered ?? '–',
    detail: 'Toda a equipe em um só lugar',
    icon: usersIcon,
  },
  {
    label: 'Funcionários ativos',
    value: totals?.active ?? '–',
    detail: `${totals?.inactive ?? 0} cadastros inativos`,
    icon: userCheck,
  },
  {
    label: 'Identificação facial configurada',
    value: totals?.faceConfigured ?? '–',
    detail: `${totals?.facePending ?? 0} funcionários com cadastro pendente`,
    icon: scanFace20,
  },
]

/** Páginas exibidas na paginação: primeira, última e vizinhas da atual. */
function pageItems(current: number, last: number): (number | '…')[] {
  const items: (number | '…')[] = []
  for (let page = 1; page <= last; page++) {
    if (page === 1 || page === last || Math.abs(page - current) <= 1) items.push(page)
    else if (items[items.length - 1] !== '…') items.push('…')
  }
  return items
}

export default function Funcionarios() {
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(1)
  const [result, setResult] = useState<EmployeePage | null>(null)
  const [totals, setTotals] = useState<EmployeeTotals | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const id = window.setTimeout(() => setSearch(query.trim()), SEARCH_DELAY_MS)
    return () => window.clearTimeout(id)
  }, [query])

  useEffect(() => {
    const controller = new AbortController()
    getEmployeeTotals(controller.signal)
      .then(setTotals)
      .catch(() => {})
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    listEmployees(
      { busca: search, departamento: department, status, pagina: page, porPagina: PAGE_SIZE },
      controller.signal,
    )
      .then((data) => {
        setResult(data)
        setError('')
      })
      .catch((reason) => {
        if (!controller.signal.aborted) setError(reason.message)
      })
    return () => controller.abort()
  }, [search, department, status, page])

  // Qualquer mudança de filtro volta para a primeira página.
  const changeFilter = (setter: (value: string) => void) => (value: string) => {
    setter(value)
    setPage(1)
  }

  const visible = result?.items ?? []
  const total = result?.total ?? 0
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const firstShown = (page - 1) * PAGE_SIZE + 1
  const stats = buildStats(totals)

  return (
    <main className="admin-content">
      <section className="page-heading">
        <div className="page-heading__text">
          <h1 className="page-heading__title">Funcionários</h1>
          <p className="page-heading__subtitle">
            Gerencie cadastros, fotos e identificação facial da sua equipe.
          </p>
        </div>
        <Link to="/admin/funcionarios/novo" className="button button--primary">
          <img src={plusIcon} alt="" />
          Cadastrar funcionário
        </Link>
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
              onChange={(event) => changeFilter(setQuery)(event.target.value)}
              aria-label="Buscar por nome ou matrícula"
            />
          </label>

          <label className="button select-button">
            <img src={chevronDown18} alt="" />
            <select
              value={department}
              onChange={(event) => changeFilter(setDepartment)(event.target.value)}
              aria-label="Departamento"
            >
              <option value="">Todos os departamentos</option>
              {departments.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="button select-button">
            <img src={chevronDown18} alt="" />
            <select
              value={status}
              onChange={(event) => changeFilter(setStatus)(event.target.value)}
              aria-label="Status"
            >
              <option value="">Todos os status</option>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </label>

          <button type="button" className="button button--icon" aria-label="Exportar lista">
            <img src={downloadIcon} alt="" />
          </button>
        </div>

        <div className="table" role="table" aria-label="Funcionários">
          <div className="table__row table__row--head" role="row">
            <span role="columnheader">FUNCIONÁRIO</span>
            <span role="columnheader">DEPARTAMENTO</span>
            <span role="columnheader">JORNADA</span>
            <span role="columnheader">IDENTIFICAÇÃO FACIAL</span>
            <span role="columnheader">STATUS</span>
            <span role="columnheader" aria-label="Ações" />
          </div>

          {visible.map((employee) => (
            <div key={employee.id} className="table__row" role="row">
              <div className="identity" role="cell">
                <Avatar className="identity__photo" name={employee.name} photo={employee.photo} />
                <div className="cell-stack">
                  <span className="identity__name">{employee.name}</span>
                  <span className="identity__id">{employee.id}</span>
                </div>
              </div>
              <div className="cell-stack" role="cell">
                <span className="cell-stack__main">{employee.department}</span>
                <span className="cell-stack__sub">{employee.role}</span>
              </div>
              <div className="cell-stack" role="cell">
                <span className="cell-stack__main">{employee.schedule}</span>
                <span className="cell-stack__sub">{employee.scheduleDays}</span>
              </div>
              <div role="cell">
                {employee.face === 'configurada' ? (
                  <span className="pill pill--primary">
                    <img src={dotPrimary} alt="" />
                    Configurada
                  </span>
                ) : (
                  <span className="pill pill--warning">
                    <img src={dotWarning} alt="" />
                    Pendente
                  </span>
                )}
              </div>
              <div role="cell">
                {employee.status === 'ativo' ? (
                  <span className="pill pill--success">Ativo</span>
                ) : (
                  <span className="pill pill--neutral">Inativo</span>
                )}
              </div>
              <div role="cell">
                <button
                  type="button"
                  className="icon-button focus-ring"
                  aria-label={`Editar cadastro de ${employee.name}`}
                >
                  <img src={ellipsisIcon} alt="" />
                </button>
              </div>
            </div>
          ))}

          {error ? (
            <p className="table__empty">{error}</p>
          ) : (
            result &&
            visible.length === 0 && (
              <p className="table__empty">Nenhum funcionário encontrado com os filtros atuais.</p>
            )
          )}
        </div>

        <div className="pagination">
          <span>
            {visible.length > 0
              ? `Mostrando ${firstShown}–${firstShown + visible.length - 1} de ${total} funcionários`
              : `Mostrando 0 de ${total} funcionários`}
          </span>
          <div className="pagination__pages">
            <button
              type="button"
              className="icon-button focus-ring"
              aria-label="Página anterior"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              <img src={chevronLeft} alt="" />
            </button>
            {pageItems(page, lastPage).map((item, index) =>
              item === '…' ? (
                <span key={`gap-${index}`} className="pagination__page">
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  className={`pagination__page focus-ring ${page === item ? 'pagination__page--current' : ''}`}
                  aria-current={page === item ? 'page' : undefined}
                  onClick={() => setPage(item)}
                >
                  {item}
                </button>
              ),
            )}
            <button
              type="button"
              className="icon-button focus-ring"
              aria-label="Próxima página"
              disabled={page >= lastPage}
              onClick={() => setPage(page + 1)}
            >
              <img src={chevronRight16} alt="" />
            </button>
          </div>
        </div>
      </section>

      <p className="footnote">
        <img src={infoIcon} alt="" />
        Uma foto de cadastro não ativa a identificação facial. Configure e valide a face de cada
        funcionário.
      </p>
    </main>
  )
}
