import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './layouts/AdminLayout'
import ClientLayout from './layouts/ClientLayout'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import AuthCallback from './pages/AuthCallback'
import AdminDashboard from './pages/admin/Dashboard'
import Clientes from './pages/admin/Clientes'
import ClienteDetalhe from './pages/admin/ClienteDetalhe'
import Demandas from './pages/admin/Demandas'
import Solicitacoes from './pages/admin/Solicitacoes'
import Relatorios from './pages/admin/Relatorios'
import Financeiro from './pages/admin/Financeiro'
import ClientDashboard from './pages/client/Dashboard'
import ClientDemandas from './pages/client/Demandas'
import ClientAprovacoes from './pages/client/Aprovacoes'
import ClientSolicitacoes from './pages/client/Solicitacoes'
import ClientHistorico from './pages/client/Historico'
import ClientChat from './pages/client/Chat'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Navigate to="/login" replace />} />
      <Route path="/esqueci-senha" element={<ForgotPassword />} />
      <Route path="/redefinir-senha" element={<ResetPassword />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Área interna: admin e equipe */}
      <Route element={<ProtectedRoute allowedRoles={['admin', 'equipe']} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="clientes/:id" element={<ClienteDetalhe />} />
          <Route path="demandas" element={<Demandas />} />
          <Route path="solicitacoes" element={<Solicitacoes />} />
          <Route path="relatorios" element={<Relatorios />} />
          <Route path="financeiro" element={<Financeiro />} />
        </Route>
      </Route>

      {/* Portal do cliente */}
      <Route element={<ProtectedRoute allowedRoles={['cliente']} />}>
        <Route path="/portal" element={<ClientLayout />}>
          <Route index element={<ClientDashboard />} />
          <Route path="demandas" element={<ClientDemandas />} />
          <Route path="aprovacoes" element={<ClientAprovacoes />} />
          <Route path="solicitacoes" element={<ClientSolicitacoes />} />
          <Route path="historico" element={<ClientHistorico />} />
          <Route path="chat" element={<ClientChat />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
