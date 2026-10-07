import { Navigate, Route, Routes } from 'react-router-dom'
import AdminLayout from './components/admin/AdminLayout'
import Funcionarios from './pages/admin/Funcionarios'
import CadastroFuncionario from './pages/admin/CadastroFuncionario'
import IdentificacaoAutomatica from './pages/terminal/IdentificacaoAutomatica'
import RegistroConfirmado from './pages/terminal/RegistroConfirmado'
import FaceNaoReconhecida from './pages/terminal/FaceNaoReconhecida'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin/funcionarios" replace />} />

      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="funcionarios" replace />} />
        <Route path="funcionarios" element={<Funcionarios />} />
        <Route path="funcionarios/novo" element={<CadastroFuncionario />} />
      </Route>

      <Route path="/ponto" element={<IdentificacaoAutomatica />} />
      <Route path="/ponto/confirmado" element={<RegistroConfirmado />} />
      <Route path="/ponto/nao-reconhecido" element={<FaceNaoReconhecida />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
