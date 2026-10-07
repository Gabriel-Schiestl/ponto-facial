import type { ReactNode } from 'react'

type NoticeProps = {
  tone: 'primary' | 'success' | 'warning'
  icon: string
  title: string
  description: string
  aside: ReactNode
}

/** Faixa de mensagem exibida abaixo da câmera. */
export default function Notice({ tone, icon, title, description, aside }: NoticeProps) {
  return (
    <section className={`notice notice--${tone}`}>
      <img src={icon} alt="" />
      <div className="notice__message">
        <p className="notice__title">{title}</p>
        <p className="notice__description">{description}</p>
      </div>
      {aside}
    </section>
  )
}
