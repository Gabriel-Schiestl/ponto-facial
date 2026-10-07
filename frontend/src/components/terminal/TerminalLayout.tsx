import type { ReactNode } from 'react'
import { formatTime, formatWeekdayDate, useNow } from '../../hooks/useNow'
import scanFaceBrand from '../../assets/icons/scan-face-brand.svg'
import dotSuccess from '../../assets/icons/dot-success.svg'
import shieldCheck from '../../assets/icons/shield-check-16.svg'
import circleHelp from '../../assets/icons/circle-help-16.svg'

type TerminalLayoutProps = {
  title: string
  subtitle: string
  children: ReactNode
}

/** Estrutura comum das telas do terminal público de ponto. */
export default function TerminalLayout({ title, subtitle, children }: TerminalLayoutProps) {
  const now = useNow()

  return (
    <div className="terminal">
      <header className="terminal-header">
        <div className="terminal-header__product">
          <div className="brand">
            <span className="brand__symbol">
              <img src={scanFaceBrand} alt="" />
            </span>
            <span className="brand__name">ponto</span>
          </div>
          <span className="divider divider--vertical" />
          <div className="terminal-header__unit">
            <p className="terminal-header__company">Horizonte Tecnologia</p>
            <p className="terminal-header__location">São Paulo · Recepção</p>
          </div>
        </div>

        <div className="terminal-header__connection">
          <span className="pill pill--success">
            <img src={dotSuccess} alt="" />
            Terminal conectado
          </span>
          <span className="terminal-header__location">Terminal 01</span>
        </div>
      </header>

      <main className="terminal-main">
        <section className="terminal-intro">
          <div className="terminal-intro__text">
            <p className="terminal-intro__eyebrow">PONTO ELETRÔNICO · IDENTIFICAÇÃO FACIAL</p>
            <h1 className="terminal-intro__title">{title}</h1>
            <p className="terminal-intro__subtitle">{subtitle}</p>
          </div>
          <div className="terminal-clock">
            <time className="terminal-clock__time" dateTime={now.toISOString()}>
              {formatTime(now)}
            </time>
            <p className="terminal-clock__date">{formatWeekdayDate(now)}</p>
          </div>
        </section>

        {children}
      </main>

      <footer className="terminal-footer">
        <div className="terminal-footer__item">
          <img src={shieldCheck} alt="" />
          <span>A câmera é usada apenas para identificar você e registrar seu ponto.</span>
          <a href="#privacidade" className="terminal-footer__link">
            Privacidade
          </a>
        </div>
        <div className="terminal-footer__item">
          <img src={circleHelp} alt="" />
          <span>Precisa de ajuda? Procure o administrador.</span>
        </div>
      </footer>
    </div>
  )
}
