import { Link, NavLink, Outlet } from 'react-router-dom'
import scanFaceLogo from '../../assets/icons/scan-face-logo-dark.svg'
import layoutDashboard from '../../assets/icons/layout-dashboard.svg'
import usersNav from '../../assets/icons/users-nav.svg'
import clock3 from '../../assets/icons/clock-3.svg'
import chartIcon from '../../assets/icons/chart.svg'
import settingsIcon from '../../assets/icons/settings.svg'
import scanFaceNav from '../../assets/icons/scan-face-nav.svg'
import arrowUpRight from '../../assets/icons/arrow-up-right.svg'
import circleHelpNav from '../../assets/icons/circle-help-nav.svg'
import chevronRight from '../../assets/icons/chevron-right-14.svg'
import bellIcon from '../../assets/icons/bell.svg'
import chevronDown from '../../assets/icons/chevron-down-16.svg'

const menu = [
  { label: 'Visão geral', icon: layoutDashboard, to: '/admin/visao-geral' },
  { label: 'Funcionários', icon: usersNav, to: '/admin/funcionarios' },
  { label: 'Registros de ponto', icon: clock3, to: '/admin/registros' },
  { label: 'Relatórios', icon: chartIcon, to: '/admin/relatorios' },
  { label: 'Configurações', icon: settingsIcon, to: '/admin/configuracoes' },
]

export default function AdminLayout() {
  return (
    <div className="admin">
      <nav className="sidebar" aria-label="Navegação administrativa">
        <div className="brand">
          <span className="brand__symbol brand__symbol--light">
            <img src={scanFaceLogo} alt="" />
          </span>
          <span className="brand__name brand__name--light">ponto</span>
        </div>

        <div className="sidebar__org">
          <p className="sidebar__org-name">Horizonte Tecnologia</p>
          <p className="sidebar__org-unit">Unidade São Paulo</p>
        </div>

        <div className="sidebar__menu">
          <p className="sidebar__section">ÁREA ADMINISTRATIVA</p>
          {menu.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `sidebar__item focus-ring ${isActive ? 'sidebar__item--active' : ''}`
              }
            >
              <img src={item.icon} alt="" />
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="sidebar__spacer" />

        <div className="sidebar__terminal">
          <img src={scanFaceNav} alt="" />
          <p className="sidebar__terminal-title">Ponto por reconhecimento</p>
          <p className="sidebar__terminal-text">Acesse a tela de registro da sua unidade.</p>
          <Link to="/ponto" className="sidebar__terminal-link focus-ring">
            Abrir terminal público
            <img src={arrowUpRight} alt="" />
          </Link>
        </div>

        <a href="#ajuda" className="sidebar__help focus-ring">
          <img src={circleHelpNav} alt="" />
          Central de ajuda
        </a>
      </nav>

      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Administração</span>
            <img src={chevronRight} alt="" />
            <span className="breadcrumb__current">Funcionários</span>
          </div>

          <div className="account">
            <button type="button" className="icon-button focus-ring" aria-label="Notificações">
              <img src={bellIcon} alt="" />
            </button>
            <span className="divider divider--vertical" />
            <button type="button" className="account__menu focus-ring">
              <span className="account__initials">MC</span>
              <span className="account__user">
                <span className="account__name">Marina Costa</span>
                <span className="account__role">Administradora</span>
              </span>
              <img src={chevronDown} alt="" />
            </button>
          </div>
        </header>

        <Outlet />
      </div>
    </div>
  )
}
