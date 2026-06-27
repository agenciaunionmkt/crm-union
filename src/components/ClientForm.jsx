import { useState } from 'react'
import Input from './ui/Input'
import Select from './ui/Select'
import Textarea from './ui/Textarea'
import Button from './ui/Button'
import { PLANOS, postsDoPlano } from '../lib/plans'

const emptyForm = {
  nome: '',
  segmento: '',
  tipo_cliente: 'avulso',
  cnpj: '',
  endereco: '',
  contato_email: '',
  contato_telefone: '',
  valor_servico: '',
  plano: '',
  posts_personalizado: '',
  plano_descricao: '',
  instagram_usuario: '',
}

export default function ClientForm({ initialValues, onSubmit, onCancel, submitting }) {
  const [form, setForm] = useState({ ...emptyForm, ...initialValues })
  const isEdit = Boolean(initialValues?.id)
  const [acessoAtivar, setAcessoAtivar] = useState(false)
  const [acessoEmail, setAcessoEmail] = useState('')
  const [vencimento, setVencimento] = useState(
    initialValues?.dia_vencimento ? String(initialValues.dia_vencimento) : ''
  )

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
      cnpj: form.cnpj || null,
      endereco: form.endereco || null,
      contato_email: form.contato_email || null,
      contato_telefone: form.contato_telefone || null,
      valor_servico: form.valor_servico ? parseFloat(form.valor_servico) : null,
      plano: form.plano || null,
      posts_personalizado:
        form.plano === 'personalizado' && form.posts_personalizado
          ? parseInt(form.posts_personalizado, 10)
          : null,
      plano_descricao: form.plano === 'personalizado' ? form.plano_descricao || null : null,
      dia_vencimento: form.tipo_cliente === 'recorrente' && vencimento ? parseInt(vencimento, 10) : null,
      instagram_usuario: form.instagram_usuario || null,
    }

    onSubmit(clientData, {
      ativar: acessoAtivar,
      email: acessoEmailFinal,
      vencimento: form.tipo_cliente === 'recorrente' ? vencimento || null : null,
    })
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
        <Select label="Tipo de Cliente" value={form.tipo_cliente} onChange={handleChange('tipo_cliente')}>
          <option value="avulso">Avulso</option>
          <option value="recorrente">Recorrente</option>
        </Select>
      </div>

      {/* CNPJ & Endereço */}
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="CNPJ"
          value={form.cnpj ?? ''}
          onChange={handleChange('cnpj')}
          placeholder="00.000.000/0000-00"
        />
        <Input
          label="Telefone"
          value={form.contato_telefone ?? ''}
          onChange={handleChange('contato_telefone')}
          placeholder="(11) 99999-9999"
        />
      </div>

      <Input
        label="Endereço"
        value={form.endereco ?? ''}
        onChange={handleChange('endereco')}
        placeholder="Rua, nº, bairro, cidade/UF, CEP"
      />

      {/* Contato */}
      <Input
        label="E-mail de contato"
        type="email"
        value={form.contato_email ?? ''}
        onChange={handleChange('contato_email')}
        placeholder="contato@cliente.com"
      />

      {/* Valor */}
      <Input
        label="Valor do serviço"
        type="number"
        value={form.valor_servico ?? ''}
        onChange={handleChange('valor_servico')}
        step="0.01"
        min="0"
        placeholder="0,00"
        leftIcon="R$"
      />

      {/* Plano */}
      <div>
        <Select label="Plano contratado" value={form.plano ?? ''} onChange={handleChange('plano')}>
          <option value="">Sem plano</option>
          {Object.entries(PLANOS).map(([key, p]) => (
            <option key={key} value={key}>
              {p.posts ? `${p.label} — ${p.posts} posts/mês` : p.label}
            </option>
          ))}
        </Select>
        {form.plano && form.plano !== 'personalizado' && (
          <p className="mt-1 text-xs text-muted">
            Gera {postsDoPlano(form.plano)} posts por mês no Agente de conteúdo.
          </p>
        )}

        {form.plano === 'personalizado' && (
          <div className="mt-4 space-y-4 rounded-lg border border-white/10 bg-white/5 p-4">
            <Input
              label="Posts por mês"
              type="number"
              min="1"
              value={form.posts_personalizado ?? ''}
              onChange={handleChange('posts_personalizado')}
              placeholder="Ex: 16"
            />
            <Textarea
              label="O que esse pacote tem de diferente"
              value={form.plano_descricao ?? ''}
              onChange={handleChange('plano_descricao')}
              placeholder="Ex: 16 posts + 4 reels + gestão de tráfego..."
            />
          </div>
        )}
      </div>

      {/* Vencimento (clientes recorrentes) */}
      {form.tipo_cliente === 'recorrente' && (
        <div>
          <Select label="Dia do vencimento" value={vencimento} onChange={(e) => setVencimento(e.target.value)}>
            <option value="">Selecione o dia</option>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
              <option key={d} value={d}>Dia {d}</option>
            ))}
          </Select>
          <p className="mt-1 text-xs text-muted">
            Todo mês a cobrança vence neste dia (gerada no Financeiro).
          </p>
        </div>
      )}

      {/* Instagram */}
      <Input
        label="Instagram (@usuário)"
        type="text"
        value={form.instagram_usuario ?? ''}
        onChange={handleChange('instagram_usuario')}
        placeholder="usuario"
        leftIcon="@"
      />

      {/* Acesso ao portal */}
      {!isEdit && (
        <div className="rounded-lg border border-white/10 bg-white/5 p-5">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={acessoAtivar}
              onChange={(e) => {
                setAcessoAtivar(e.target.checked)
                if (e.target.checked && !acessoEmail) setAcessoEmail(form.contato_email ?? '')
              }}
              className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 accent-yellow-400"
            />
            <span>
              <span className="block text-sm font-normal text-subtle">
                Dar acesso ao portal do cliente
              </span>
              <span className="block text-xs text-muted">
                Enviaremos um e-mail para o cliente criar a própria senha.
              </span>
            </span>
          </label>

          {acessoAtivar && (
            <div className="mt-4">
              <Input
                label="E-mail de acesso"
                type="email"
                value={acessoEmail}
                onChange={(e) => setAcessoEmail(e.target.value)}
                placeholder="cliente@empresa.com"
              />
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
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
