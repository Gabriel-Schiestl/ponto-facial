/** Identificação deste terminal, enviada junto com cada registro de ponto. */
export const terminal = {
  name: import.meta.env.VITE_TERMINAL_NOME ?? 'Terminal 01',
  location: import.meta.env.VITE_TERMINAL_LOCAL ?? 'São Paulo · Recepção',
}
