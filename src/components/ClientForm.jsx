import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import Input from './ui/Input'
import Button from './ui/Button'

const emptyForm = {
  nome: '',
  segmento: '',
  tipo_cliente: 'avulso',
  contato_email: '',
  contato_telefone: '',
  valor_servico: '',
  instagram_usuario: '',
  instagram_senha: '',
}

export default function ClientForm({ initialValues, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState({ ...emptyForm, ...initialValues })
  const [showInstaSenha, setShowInstaSenha] = useState(false)
  const isEdit = Boolean(initialValues?.id)
  const [acessoAtivar, setAcessoAtivar] = useState(false)
  const [acessoEmail, setAcessoEmail] = useState('')

  function handleChange(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  function handleSubmit(e) {
    e.preventDefault()

    // Validações
    if (!form.nome.trim()) {
      alert('Nome do cliente é obrigatório')
      return
    }

    // Se tem valor, validar se é número válido
    if (form.valor_servico && parseFloat(form.valor_servico) < 0) {
      alert('Valor do serviço não pode ser negativo')
      return
    }

    const acessoEmailFinal = (acessoEmail || form.contato_email || '').trim()
    if (acessoAtivar && !acessoEmailFinal) {
      alert('Informe o e-mail de acesso do cliente')
      return
    }

    // Payload com apenas colunas válidas da tabela clients
    const clientData = {
      nome: form.nome.trim(),
      segmento: form.segmento || null,
      tipo_cliente: form.tipo_cliente,
      contato_email: form.contato_email || null,
      contato_telefone: form.contato_telefone || null,
      valor_servico: form.valor_servico ? parseFloat(form.valor_servico) : null,
      instagram_usuario: form.instagram_usuario || null,
      instagram_senha: form.instagram_senha || null,
    }

    onSubmit(clientData, { ativar: acessoAtivar, email: acessoEmailFinal })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Nome */}
      <Input
        label="Nome do cliente"
        required
        value={form.nome}
        onChange={handleChange('nome')}
        placeholder="Ex: Loja Bella Moda"
      />

      {/* Segmento & Tipo */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Segmento"
          value={form.segmento ?? ''}
          onChange={handleChange('segmento')}
          placeholder="Ex: Moda, Alimentação..."
        />
        <div>
          <label className="mb-1.5 block text-sm font-normal text-neutral-700 dark:text-neutral-300">
            Tipo de Cliente
          </label>
          <select
            value={form.tipo_cliente}
            onChange={handleChange('tipo_cliente')}
            className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-transparent dark:bg-transparent text-neutral-900 dark:text-white text-sm focus:outline-none dark:focus:ring-emerald-400"
          >
            <option value="avulso">Avulso</option>
            <option value="recorrente">Recorrente</option>
          </select>
        </div>
      </div>

      {/* Contato */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="E-mail de contato"
          type="email"
          value={form.contato_email ?? ''}
          onChange={handleChange('contato_email')}
          placeholder="contato@cliente.com"
        />
        <Input
          label="Telefone"
          value={form.contato_telefone ?? ''}
          onChange={handleChange('contato_telefone')}
          placeholder="(11) 99999-9999"
        />
      </div>

      {/* Valor */}
      <div>
        <label className="mb-1.5 block text-sm font-normal text-neutral-700 dark:text-neutral-300">
          Valor do serviço
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm font-normal text-neutral-600 dark:text-neutral-400">R$</span>
          <input
            type="number"
            value={form.valor_servico ?? ''}
            onChange={handleChange('valor_servico')}
            step="0.01"
            min="0"
            placeholder="0,00"
            className="flex-1 px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-transparent dark:bg-transparent text-neutral-900 dark:text-white text-sm focus:outline-none dark:focus:ring-emerald-400"
          />
        </div>
      </div>

      {/* Instagram */}
      <div className="rounded-lg border border-neutral-300 dark:border-neutral-700/50 bg-neutral-100 dark:bg-neutral-800/20 p-5">
        <h3 className="text-sm font-normal text-neutral-900 dark:text-neutral-300 mb-4">
          📱 Dados do Instagram
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-normal text-neutral-600 dark:text-neutral-400">
              Usuário (@)
            </label>
            <div className="flex items-center gap-1">
              <span className="text-sm text-neutral-600 dark:text-neutral-500">@</span>
              <input
                type="text"
                value={form.instagram_usuario ?? ''}
                onChange={handleChange('instagram_usuario')}
                placeholder="usuario"
                className="flex-1 px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-transparent dark:bg-transparent text-neutral-900 dark:text-white text-sm focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-normal text-neutral-600 dark:text-neutral-400">
              Senha
            </label>
            <div className="relative">
              <input
                type={showInstaSenha ? 'text' : 'password'}
                value={form.instagram_senha ?? ''}
                onChange={handleChange('instagram_senha')}
                placeholder="••••••••"
                className="w-full px-3 py-2 pr-10 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-transparent dark:bg-transparent text-neutral-900 dark:text-white text-sm focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowInstaSenha((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-300 focus:outline-none"
                aria-label={showInstaSenha ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showInstaSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Acesso ao portal */}
      {!isEdit && (
        <div className="rounded-lg border border-neutral-300 dark:border-neutral-700/50 bg-neutral-100 dark:bg-neutral-800/20 p-5">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acessoAtivar}
              onChange={(e) => {
                setAcessoAtivar(e.target.checked)
                if (e.target.checked && !acessoEmail) setAcessoEmail(form.contato_email ?? '')
              }}
              className="mt-0.5 h-4 w-4 rounded border-neutral-400 accent-emerald-500"
            />
            <span>
              <span className="block text-sm font-normal text-neutral-900 dark:text-neutral-300">
                Dar acesso ao portal do cliente
              </span>
              <span className="block text-xs text-neutral-500 dark:text-neutral-400">
                Enviaremos um e-mail para o cliente criar a própria senha.
              </span>
            </span>
          </label>

          {acessoAtivar && (
            <div className="mt-4">
              <label className="mb-1.5 block text-xs font-normal text-neutral-600 dark:text-neutral-400">
                E-mail de acesso
              </label>
              <input
                type="email"
                value={acessoEmail}
                onChange={(e) => setAcessoEmail(e.target.value)}
                placeholder="cliente@empresa.com"
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 dark:border-neutral-600 bg-transparent dark:bg-transparent text-neutral-900 dark:text-white text-sm focus:outline-none"
              />
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={submitting}
        >
          {submitting ? 'Salvando...' : 'Salvar cliente'}
        </Button>
      </div>
    </form>
  )
}
