import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './layouts/AdminLayout'
import ClientLayout from './layouts/ClientLayout'

// Páginas carregadas sob demanda (code splitting por rota)
const Login = lazy(() => import('./pages/Login'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const AuthCallback = lazy(() => import('./pages/AuthCallback'))
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))
const Clientes = lazy(() => import('./pages/admin/Clientes'))
const ClienteDetalhe = lazy(() => import('./pages/admin/ClienteDetalhe'))
const Demandas = lazy(() => import('./pages/admin/Demandas'))
const Solicitacoes = lazy(() => import('./pages/admin/Solicitacoes'))
const AdminChat = lazy(() => import('./pages/admin/Chat'))
const Assistente = lazy(() => import('./pages/admin/Assistente'))
const AgenteConteudo = lazy(() => import('./pages/admin/AgenteConteudo'))
const Relatorios = lazy(() => import('./pages/admin/Relatorios'))
const Financeiro = lazy(() => import('./pages/admin/Financeiro'))
const ClientDemandas = lazy(() => import('./pages/client/Demandas'))
const ClientCalendario = lazy(() => import('./pages/client/Calendario'))
const ClientAprovacoes = lazy(() => import('./pages/client/Aprovacoes'))
const ClientSolicitacoes = lazy(() => import('./pages/client/Solicitacoes'))
const ClientHistorico = lazy(() => import('./pages/client/Historico'))
const ClientChat = lazy(() => import('./pages/client/Chat'))

function Carregando() {
  return (
    <div className="flex min-h-screen items-center justify-center union-app-bg">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/15 border-t-yellow-400" />
    </div>
  )
}

function App() {
  return (
    <Suspense fallback={<Carregando />}>
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
            <Route path="mensagens" element={<AdminChat />} />
            <Route path="assistente" element={<Assistente />} />
            <Route path="agente-conteudo" element={<AgenteConteudo />} />
            <Route path="solicitacoes" element={<Solicitacoes />} />
            <Route path="relatorios" element={<Relatorios />} />
            <Route path="financeiro" element={<Financeiro />} />
          </Route>
        </Route>

        {/* Portal do cliente */}
        <Route element={<ProtectedRoute allowedRoles={['cliente']} />}>
          <Route path="/portal" element={<ClientLayout />}>
            <Route index element={<Navigate to="/portal/solicitacoes" replace />} />
            <Route path="calendario" element={<ClientCalendario />} />
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
    </Suspense>
  )
}

export default App
