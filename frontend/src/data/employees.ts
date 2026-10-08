export type FaceStatus = 'configurada' | 'pendente'
export type EmploymentStatus = 'ativo' | 'inativo'

/** Formato devolvido pela API (backend/app/schemas.py). */
export type Employee = {
  id: string
  name: string
  photo: string | null
  department: string
  role: string
  schedule: string
  scheduleDays: string
  face: FaceStatus
  status: EmploymentStatus
}

export const departments = ['Produto', 'Tecnologia', 'Pessoas', 'Operações', 'Financeiro']

export const units = ['São Paulo', 'Rio de Janeiro']

export const schedules = ['Segunda a sexta · 08:00 às 17:00', 'Segunda a sexta · 09:00 às 18:00']
