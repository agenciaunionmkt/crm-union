import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { listLeads, createLead, updateLead, deleteLead } from '../../lib/api/leads'
import { useAuth } from '../../context/AuthContext'
import LeadModal, { ETAPAS } from '../../components/LeadModal'

const ORIGEM_LABEL = {
  indicacao: 'Indicação', prospeccao_ativa: 'Prospecção', instagram: 'Instagram',
  google: 'Google', outro: 'Outro',
}
const SERVICO_LABEL = {
  lp: 'Landing Page', site: 'Site', branding: 'Branding',
  identidade_visual: 'Id. Visual', pacote: 'Pacote',
}
const STATUS_COLOR = {
  qualificado:         'bg-emerald-500/15 text-emerald-300',
  nao_qualificado:     'bg-danger/15 text-danger',
  aguardando_resposta: 'bg-accent/15 text-accent',
  reativacao:          'bg-violet-500/15 text-violet-300',
}
const ETAPA_COLOR = {
  lead:         'border-l-white/20',
  diagnostico:  'border-l-blue-400',
  reuniao:      'border-l-violet-400',
  proposta:     'border-l-amber-400',
  conversao:    'border-l-emerald-400',
  em_andamento: 'border-l-accent',
  entregue:     'border-l-sky-400',
  pos_venda:    'border-l-pink-400',
}

function LeadCard({ lead, onClick, onDragStart }) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className={`cursor-pointer rounded-xl border-l-2 border border-border bg-surface p-3 hover:bg-surface-2 transition-colors ${ETAPA_COLOR[lead.etapa] || ''}`}
    >
      <p className="font-medium text-sm text-foreground truncate">{lead.nome}</p>
      {lead.empresa && <p className="text-xs text-muted truncate mt-0.5">{lead.empresa}</p>}
      <div className="mt-2 flex flex-wrap gap-1">
        {lead.servico_interesse && (
          <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-subtle">
            {SERVICO_LABEL[lead.servico_interesse] || lead.servico_interesse}
          </span>
        )}
        {lead.origem && (
          <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-subtle">
            {ORIGEM_LABEL[lead.origem] || lead.origem}
          </span>
        )}
        {lead.status_qualificacao && (
          <span className={`rounded-md px-1.5 py-0.5 text-[10px] ${STATUS_COLOR[lead.status_qualificacao] || 'bg-white/5 text-subtle'}`}>
            {lead.status_qualificacao.replace(/_/g, ' ')}
          </span>
        )}
      </div>
    </div>
  )
}

function KanbanColumn({ etapa, leads, onAddLead, onCardClick, onDrop }) {
  const [over, setOver] = useState(false)

  return (
    <div
      className="flex w-64 flex-shrink-0 flex-col"
      onDragOver={(e) => { e.preventDefault(); setOver(true) }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        const leadId = e.dataTransfer.getData('leadId')
        if (leadId) onDrop(etapa.id, leadId)
      }}
    >
      <div className="mb-2 flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">{etapa.label}</span>
          <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-muted">{leads.length}</span>
        </div>
        <button type="button" onClick={() => onAddLead(etapa.id)}
          className="rounded-lg p-1 text-muted hover:bg-white/5 hover:text-foreground transition-colors" title="Adicionar lead">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className={`flex-1 rounded-xl p-2 space-y-2 min-h-24 transition-colors ${over ? 'bg-accent/5 ring-1 ring-accent/30' : 'bg-white/[0.02]'}`}>
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onClick={() => onCardClick(lead)}
            onDragStart={(e) => { e.dataTransfer.setData('leadId', lead.id) }}
          />
        ))}
      </div>
    </div>
  )
}

export default function Leads() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()
  const [modal, setModal] = useState(null)  // null | { lead, etapaInicial }

  const { data: leads = [], isLoading } = useQuery({ queryKey: ['leads'], queryFn: listLeads })

  const createMutation = useMutation({
    mutationFn: (payload) => createLead({ ...payload, criado_por: profile?.id ?? null }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['leads'] }); setModal(null) },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...payload }) => updateLead(id, payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['leads'] }); setModal(null) },
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteLead(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['leads'] }); setModal(null) },
  })

  function handleSave(form) {
    if (modal?.lead?.id) {
      updateMutation.mutate({ id: modal.lead.id, ...form })
    } else {
      createMutation.mutate(form)
    }
  }

  function handleDrop(novaEtapa, leadId) {
    const lead = leads.find((l) => l.id === leadId)
    if (lead && lead.etapa !== novaEtapa) {
      updateMutation.mutate({ id: leadId, etapa: novaEtapa })
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Pipeline</h1>
          <p className="mt-1 text-sm text-muted">{leads.length} lead{leads.length !== 1 ? 's' : ''} no funil</p>
        </div>
        <button type="button"
          onClick={() => setModal({ lead: null })}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground hover:opacity-90 transition-colors active:scale-95">
          <Plus className="h-4 w-4" /> Novo lead
        </button>
      </div>

      {/* Kanban */}
      {isLoading ? (
        <p className="text-sm text-muted">Carregando...</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4 flex-1">
          {ETAPAS.map((etapa) => (
            <KanbanColumn
              key={etapa.id}
              etapa={etapa}
              leads={leads.filter((l) => l.etapa === etapa.id)}
              onAddLead={(etapaId) => setModal({ lead: { etapa: etapaId } })}
              onCardClick={(lead) => setModal({ lead })}
              onDrop={handleDrop}
            />
          ))}
        </div>
      )}

      <LeadModal
        key={modal?.lead?.id ?? 'new'}
        open={!!modal}
        lead={modal?.lead}
        onClose={() => setModal(null)}
        onSave={handleSave}
        onDelete={() => modal?.lead?.id && deleteMutation.mutate(modal.lead.id)}
        isSaving={isSaving}
      />
    </div>
  )
}
