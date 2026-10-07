import anaSouza from '../assets/images/ana-souza.jpg'
import brunoLima from '../assets/images/bruno-lima.jpg'
import carlaOliveira from '../assets/images/carla-oliveira.jpg'
import diegoSantos from '../assets/images/diego-santos.jpg'
import elisaPereira from '../assets/images/elisa-pereira.jpg'
import rafaelCosta from '../assets/images/rafael-costa.jpg'

export type FaceStatus = 'configurada' | 'pendente'
export type EmploymentStatus = 'ativo' | 'inativo'

export type Employee = {
  id: string
  name: string
  photo: string
  department: string
  role: string
  schedule: string
  scheduleDays: string
  face: FaceStatus
  status: EmploymentStatus
}

/** Dados fictícios para demonstração. */
export const employees: Employee[] = [
  {
    id: 'HT-001',
    name: 'Ana Souza',
    photo: anaSouza,
    department: 'Produto',
    role: 'Designer de produto',
    schedule: '08:00 – 17:00',
    scheduleDays: 'Segunda a sexta',
    face: 'configurada',
    status: 'ativo',
  },
  {
    id: 'HT-002',
    name: 'Bruno Lima',
    photo: brunoLima,
    department: 'Tecnologia',
    role: 'Desenvolvedor',
    schedule: '08:00 – 17:00',
    scheduleDays: 'Segunda a sexta',
    face: 'configurada',
    status: 'ativo',
  },
  {
    id: 'HT-003',
    name: 'Carla Oliveira',
    photo: carlaOliveira,
    department: 'Pessoas',
    role: 'Analista de RH',
    schedule: '08:00 – 17:00',
    scheduleDays: 'Segunda a sexta',
    face: 'configurada',
    status: 'ativo',
  },
  {
    id: 'HT-004',
    name: 'Diego Santos',
    photo: diegoSantos,
    department: 'Operações',
    role: 'Analista de operações',
    schedule: '08:00 – 17:00',
    scheduleDays: 'Segunda a sexta',
    face: 'pendente',
    status: 'ativo',
  },
  {
    id: 'HT-005',
    name: 'Elisa Pereira',
    photo: elisaPereira,
    department: 'Financeiro',
    role: 'Analista financeira',
    schedule: '08:00 – 17:00',
    scheduleDays: 'Segunda a sexta',
    face: 'pendente',
    status: 'ativo',
  },
  {
    id: 'HT-006',
    name: 'Rafael Costa',
    photo: rafaelCosta,
    department: 'Tecnologia',
    role: 'Coordenador técnico',
    schedule: '08:00 – 17:00',
    scheduleDays: 'Segunda a sexta',
    face: 'configurada',
    status: 'inativo',
  },
]

export const departments = ['Produto', 'Tecnologia', 'Pessoas', 'Operações', 'Financeiro']

/** Totais exibidos nos indicadores (base completa da unidade). */
export const employeeTotals = {
  registered: 48,
  active: 46,
  inactive: 2,
  faceConfigured: 42,
  facePending: 6,
}
