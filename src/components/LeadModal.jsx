import { useState } from 'react'
import { Trash2, ChevronRight, ChevronLeft } from 'lucide-react'
import Modal from './ui/Modal'
import Input from './ui/Input'
import Textarea from './ui/Textarea'
import { fieldBase, fieldBorder } from './ui/Input'

export const ETAPAS = [
  { id: 'lead',         label: 'Lead' },
  { id: 'diagnostico',  label: 'Diagnóstico' },
  { id: 'reuniao',      label: 'Reunião' },
  { id: 'proposta',     label: 'Proposta' },
  { id: 'conversao',    label: 'Conversão' },
  { id: 'em_andamento', label: 'Em Andamento' },
  { id: 'entregue',     label: 'Entregue' },
  { id: 'pos_venda',    label: 'Pós-venda' },
]

const ORIGEM_OPTS = [
  { value: 'indicacao',        label: 'Indicação' },
  { value: 'prospeccao_ativa', label: 'Prospecção Ativa' },
  { value: 'instagram',        label: 'Instagram' },
  { value: 'google',           label: 'Google' },
  { value: 'outro',            label: 'Outro' },
]

const SERVICO_OPTS = [
  { value: 'lp',               label: 'Landing Page' },
  { value: 'site',             label: 'Site' },
  { value: 'branding',         label: 'Branding' },
  { value: 'identidade_visual',label: 'Identidade Visual' },
  { value: 'pacote',           label: 'Pacote' },
]

const STATUS_OPTS = [
  { value: 'aguardando_resposta', label: 'Aguardando resposta' },
  { value: 'qualificado',         label: 'Qualificado' },
  { value: 'nao_qualificado',     label: 'Não qualificado' },
  { value: 'reativacao',          label: 'Reativação' },
]

const FORMA_PAG_OPTS = ['PIX', 'Boleto', 'Cartão', 'Transferência', 'Outro']

function Section({ title, children }) {
  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-subtle">{title}</p>
      {children}
    </div>
  )
}

function Row({ children }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>
}

function Sel({ label, value, onChange, children }) {
  const cls = `${fieldBase} ${fieldBorder(false)} [color-scheme:dark]`
  return (
    <div className="w-full">
      {label && <label className="mb-1.5 block text-sm font-medium text-muted">{label}</label>}
      <select value={value} onChange={onChange} className={cls}>{children}</select>
    </div>
  )
}

function DadosEtapa({ etapaId, dados, onChange }) {
  function set(key, val) { onChange({ ...dados, [key]: val }) }

  if (etapaId === 'diagnostico') return (
    <div className="space-y-3">
      <Input label="O que o cliente faz" value={dados.o_que_faz || ''} onChange={(e) => set('o_que_faz', e.target.value)} />
      <Textarea label="O que precisa" value={dados.o_que_precisa || ''} onChange={(e) => set('o_que_precisa', e.target.value)} rows={2} />
      <Row>
        <Input label="Prazo desejado" value={dados.prazo_desejado || ''} onChange={(e) => set('prazo_desejado', e.target.value)} placeholder="Ex: 30 dias" />
        <Input label="Orçamento estimado (R$)" value={dados.orcamento_estimado || ''} onChange={(e) => set('orcamento_estimado', e.target.value)} />
      </Row>
    </div>
  )

  if (etapaId === 'reuniao') return (
    <div className="space-y-3">
      <Input label="Data da reunião" type="date" value={dados.data_reuniao || ''} onChange={(e) => set('data_reuniao', e.target.value)} />
      <Textarea label="Notas da conversa" value={dados.notas || ''} onChange={(e) => set('notas', e.target.value)} rows={3} />
    </div>
  )

  if (etapaId === 'proposta') return (
    <div className="space-y-3">
      <Row>
        <Input label="Data de envio" type="date" value={dados.data_envio || ''} onChange={(e) => set('data_envio', e.target.value)} />
        <Input label="Prazo de resposta" type="date" value={dados.prazo_resposta || ''} onChange={(e) => set('prazo_resposta', e.target.value)} />
      </Row>
      <Row>
        <Input label="Serviço proposto" value={dados.servico_proposto || ''} onChange={(e) => set('servico_proposto', e.target.value)} />
        <Input label="Valor (R$)" value={dados.valor || ''} onChange={(e) => set('valor', e.target.value)} placeholder="0,00" />
      </Row>
    </div>
  )

  if (etapaId === 'conversao') return (
    <div className="space-y-3">
      <Row>
        <Input label="Data de fechamento" type="date" value={dados.data_fechamento || ''} onChange={(e) => set('data_fechamento', e.target.value)} />
        <Input label="Valor fechado (R$)" value={dados.valor_fechado || ''} onChange={(e) => set('valor_fechado', e.target.value)} placeholder="0,00" />
      </Row>
      <Sel label="Forma de pagamento" value={dados.forma_pagamento || ''} onChange={(e) => set('forma_pagamento', e.target.value)}>
        <option value="">Selecionar</option>
        {FORMA_PAG_OPTS.map((f) => <option key={f} value={f}>{f}</option>)}
      </Sel>
    </div>
  )

  if (etapaId === 'em_andamento') return (
    <div className="space-y-3">
      <Input label="Prazo de entrega" type="date" value={dados.prazo_entrega || ''} onChange={(e) => set('prazo_entrega', e.target.value)} />
      <Textarea label="Checkpoints internos" value={dados.checkpoints || ''} onChange={(e) => set('checkpoints', e.target.value)} rows={3} placeholder="Liste os marcos do projeto..." />
    </div>
  )

  if (etapaId === 'pos_venda') return (
    <div className="space-y-3">
      <Input label="Data do check-in" type="date" value={dados.data_checkin || ''} onChange={(e) => set('data_checkin', e.target.value)} />
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={!!dados.depoimento_coletado} onChange={(e) => set('depoimento_coletado', e.target.checked)} className="rounded border-border accent-accent h-4 w-4" />
        <span className="text-sm text-muted">Depoimento coletado</span>
      </label>
      <Textarea label="Potencial de reativação" value={dados.potencial_reativacao || ''} onChange={(e) => set('potencial_reativacao', e.target.value)} rows={2} />
    </div>
  )

  return null
}

const ETAPAS_COM_DADOS = ['diagnostico', 'reuniao', 'proposta', 'conversao', 'em_andamento', 'pos_venda']

export default function LeadModal({ open, lead, onClose, onSave, onDelete, isSaving }) {
  const isNew = !lead?.id
  const etapaIdx = ETAPAS.findIndex((e) => e.id === (lead?.etapa || 'lead'))

  const [form, setForm] = useState(() => ({
    nome: lead?.nome || '',
    empresa: lead?.empresa || '',
    whatsapp: lead?.whatsapp || '',
    email: lead?.email || '',
    origem: lead?.origem || 'outro',
    quem_indicou: lead?.quem_indicou || '',
    servico_interesse: lead?.servico_interesse || '',
    tipo_cliente: lead?.tipo_cliente || 'avulso',
    observacoes: lead?.observacoes || '',
    etapa: lead?.etapa || 'lead',
    status_qualificacao: lead?.status_qualificacao || 'aguardando_resposta',
    dados_diagnostico:  lead?.dados_diagnostico  || {},
    dados_reuniao:      lead?.dados_reuniao      || {},
    dados_proposta:     lead?.dados_proposta     || {},
    dados_conversao:    lead?.dados_conversao    || {},
    dados_em_andamento: lead?.dados_em_andamento || {},
    dados_pos_venda:    lead?.dados_pos_venda    || {},
  }))

  function set(key, val) { setForm((f) => ({ ...f, [key]: val })) }

  const sel = `${fieldBase} ${fieldBorder(false)} [color-scheme:dark]`
  const etapaAtualIdx = ETAPAS.findIndex((e) => e.id === form.etapa)
  const podePrev = etapaAtualIdx > 0
  const podeNext = etapaAtualIdx < ETAPAS.length - 1

  return (
    <Modal
      open={open}
      title={isNew ? 'Novo lead' : (lead?.nome || 'Lead')}
      onClose={onClose}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Etapa atual + navegação */}
        <div className="flex items-center justify-between rounded-xl bg-surface-2 px-4 py-3">
          <button type="button" disabled={!podePrev} onClick={() => set('etapa', ETAPAS[etapaAtualIdx - 1].id)}
            className="rounded-lg p-1.5 text-muted hover:bg-white/5 hover:text-foreground disabled:opacity-30 transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-widest text-subtle">Etapa atual</p>
            <p className="font-display text-base font-bold text-foreground">{ETAPAS[etapaAtualIdx]?.label}</p>
            <p className="text-[10px] text-muted">{etapaAtualIdx + 1} de {ETAPAS.length}</p>
          </div>
          <button type="button" disabled={!podeNext} onClick={() => set('etapa', ETAPAS[etapaAtualIdx + 1].id)}
            className="rounded-lg p-1.5 text-muted hover:bg-white/5 hover:text-foreground disabled:opacity-30 transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Dados básicos */}
        <Section title="Dados básicos">
          <Row>
            <Input label="Nome *" value={form.nome} onChange={(e) => set('nome', e.target.value)} placeholder="Nome do lead" />
            <Input label="Empresa" value={form.empresa} onChange={(e) => set('empresa', e.target.value)} />
          </Row>
          <Row>
            <Input label="WhatsApp" value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} placeholder="(00) 00000-0000" />
            <Input label="E-mail" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
          </Row>
          <Row>
            <Sel label="Origem" value={form.origem} onChange={(e) => set('origem', e.target.value)}>
              {ORIGEM_OPTS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Sel>
            {form.origem === 'indicacao'
              ? <Input label="Quem indicou" value={form.quem_indicou} onChange={(e) => set('quem_indicou', e.target.value)} />
              : <Sel label="Serviço de interesse" value={form.servico_interesse} onChange={(e) => set('servico_interesse', e.target.value)}>
                  <option value="">Selecionar</option>
                  {SERVICO_OPTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </Sel>
            }
          </Row>
          {form.origem === 'indicacao' && (
            <Sel label="Serviço de interesse" value={form.servico_interesse} onChange={(e) => set('servico_interesse', e.target.value)}>
              <option value="">Selecionar</option>
              {SERVICO_OPTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </Sel>
          )}
          <Row>
            <Sel label="Tipo de cliente" value={form.tipo_cliente} onChange={(e) => set('tipo_cliente', e.target.value)}>
              <option value="avulso">Avulso</option>
              <option value="recorrente">Recorrente</option>
            </Sel>
            <Sel label="Status" value={form.status_qualificacao} onChange={(e) => set('status_qualificacao', e.target.value)}>
              {STATUS_OPTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </Sel>
          </Row>
          <Textarea label="Observações iniciais" value={form.observacoes} onChange={(e) => set('observacoes', e.target.value)} rows={2} />
        </Section>

        {/* Dados da etapa atual (e anteriores com dados) */}
        {ETAPAS_COM_DADOS.filter((eid) => {
          const idx = ETAPAS.findIndex((e) => e.id === eid)
          return idx <= etapaAtualIdx
        }).map((eid) => {
          const dadosKey = `dados_${eid}`
          const etapaLabel = ETAPAS.find((e) => e.id === eid)?.label
          const isCurrent = eid === form.etapa
          return (
            <Section key={eid} title={`${etapaLabel}${isCurrent ? ' — atual' : ''}`}>
              <DadosEtapa
                etapaId={eid}
                dados={form[dadosKey] || {}}
                onChange={(val) => set(dadosKey, val)}
              />
            </Section>
          )
        })}

        {/* Ações */}
        <div className="flex items-center justify-between border-t border-border pt-4">
          {!isNew ? (
            <button type="button" onClick={onDelete}
              className="inline-flex items-center gap-1.5 rounded-xl border border-danger/30 px-3 py-2 text-sm text-danger hover:bg-danger/10 transition-colors">
              <Trash2 className="h-4 w-4" /> Excluir lead
            </button>
          ) : <span />}
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-sm text-muted hover:bg-white/5 transition-colors">
              Cancelar
            </button>
            <button type="button" disabled={isSaving || !form.nome.trim()} onClick={() => onSave(form)}
              className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90 disabled:opacity-50 transition-colors">
              {isSaving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
