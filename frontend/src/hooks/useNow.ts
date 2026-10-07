import { useEffect, useState } from 'react'

/** Data/hora atual, atualizada a cada `intervalMs`. */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])

  return now
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

/** "08:02" */
export const formatTime = (date: Date) =>
  date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })

/** "08:02:14" */
export const formatTimeWithSeconds = (date: Date) =>
  date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

/** "07 de outubro de 2026" */
export const formatLongDate = (date: Date) =>
  date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

/** "Quarta-feira, 07 de outubro de 2026" */
export const formatWeekdayDate = (date: Date) =>
  `${capitalize(date.toLocaleDateString('pt-BR', { weekday: 'long' }))}, ${formatLongDate(date)}`
