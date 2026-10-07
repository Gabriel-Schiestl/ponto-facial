import type { Employee } from './data/employees'

/** Base da API. Em desenvolvimento o Vite encaminha `/api` para o backend. */
const API_URL = import.meta.env.VITE_API_URL ?? ''

export type EmployeePage = {
  items: Employee[]
  total: number
  page: number
  pageSize: number
}

export type EmployeeTotals = {
  registered: number
  active: number
  inactive: number
  faceConfigured: number
  facePending: number
}

export type QualityCheck = { label: string; ok: boolean }

export type FaceValidation = {
  valid: boolean
  message: string
  checks: QualityCheck[]
}

export type PunchType = 'entrada' | 'saida_intervalo' | 'retorno_intervalo' | 'saida'

export type Punch = {
  id: number
  employee: Employee
  type: PunchType
  typeLabel: string
  registeredAt: string
  receipt: string
  terminal: string | null
  location: string | null
  duplicate?: boolean
}

/** Erro devolvido pela API (`detail.message`, e `detail.checks` na captura facial). */
export class ApiError extends Error {
  status: number
  checks: QualityCheck[]

  constructor(status: number, message: string, checks: QualityCheck[] = []) {
    super(message)
    this.status = status
    this.checks = checks
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, init)
  } catch {
    throw new ApiError(0, 'Não foi possível conectar ao servidor.')
  }

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const detail = body?.detail
    // Erros de validação do FastAPI chegam como lista em `detail`.
    const message =
      typeof detail?.message === 'string'
        ? detail.message
        : Array.isArray(detail)
          ? 'Confira os campos do formulário.'
          : 'Ocorreu um erro inesperado.'
    throw new ApiError(response.status, message, detail?.checks ?? [])
  }

  return response.status === 204 ? (undefined as T) : response.json()
}

const imageForm = (fields: Record<string, string | Blob>) => {
  const form = new FormData()
  for (const [key, value] of Object.entries(fields)) form.append(key, value)
  return form
}

export function listEmployees(
  filters: { busca?: string; departamento?: string; status?: string; pagina?: number; porPagina?: number },
  signal?: AbortSignal,
) {
  const params = new URLSearchParams()
  if (filters.busca) params.set('busca', filters.busca)
  if (filters.departamento) params.set('departamento', filters.departamento)
  if (filters.status) params.set('status', filters.status)
  if (filters.pagina) params.set('pagina', String(filters.pagina))
  if (filters.porPagina) params.set('por_pagina', String(filters.porPagina))
  return request<EmployeePage>(`/api/funcionarios?${params}`, { signal })
}

export const getEmployeeTotals = (signal?: AbortSignal) =>
  request<EmployeeTotals>('/api/funcionarios/resumo', { signal })

export const createEmployee = (form: FormData) =>
  request<Employee>('/api/funcionarios', { method: 'POST', body: form })

export const validateFace = (image: Blob) =>
  request<FaceValidation>('/api/funcionarios/face/validar', {
    method: 'POST',
    body: imageForm({ imagem: image }),
  })

export const registerPunch = (image: Blob, terminal: string, local: string) =>
  request<Punch>('/api/ponto', {
    method: 'POST',
    body: imageForm({ imagem: image, terminal, local }),
  })
