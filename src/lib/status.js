// Fonte única dos rótulos/estilos de status (evita duplicação entre telas).

export const demandStatusLabels = {
  a_fazer: 'A fazer',
  em_andamento: 'Em andamento',
  em_revisao: 'Em revisão',
  entregue: 'Aguardando aprovação',
  aprovado: 'Aprovado',
}
export const demandStatusStyles = {
  a_fazer: 'bg-white/5 text-neutral-300 border border-white/10',
  em_andamento: 'bg-violet-500/15 text-violet-300 border border-violet-500/30',
  em_revisao: 'bg-yellow-400/15 text-yellow-300 border border-yellow-400/30',
  entregue: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
  aprovado: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
}

export const requestStatusLabels = {
  pendente: 'Pendente',
  em_analise: 'Em análise',
  convertido: 'Convertido em demanda',
  recusado: 'Recusado',
}
export const requestStatusStyles = {
  pendente: 'bg-yellow-400/15 text-yellow-300 border border-yellow-400/30',
  em_analise: 'bg-violet-500/15 text-violet-300 border border-violet-500/30',
  convertido: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  recusado: 'bg-white/5 text-neutral-400 border border-white/10',
}

export const approvalStatusLabels = {
  pendente: 'Pendente',
  aprovado: 'Aprovado',
  revisao_solicitada: 'Revisão solicitada',
}
export const approvalStatusStyles = {
  pendente: 'bg-yellow-400/15 text-yellow-300 border border-yellow-400/30',
  aprovado: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
  revisao_solicitada: 'bg-orange-500/15 text-orange-300 border border-orange-500/30',
}
