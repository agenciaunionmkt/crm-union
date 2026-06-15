// Planos da agência e quantidade de posts por mês.
export const PLANOS = {
  essencial: { label: 'Essencial', posts: 12 },
  master: { label: 'Master', posts: 20 },
  premium: { label: 'Premium', posts: 28 },
  personalizado: { label: 'Personalizado', posts: null },
}

export function postsDoPlano(plano) {
  return PLANOS[plano]?.posts ?? 0
}

export function labelDoPlano(plano) {
  return PLANOS[plano]?.label ?? '—'
}

// Posts/mês considerando o cliente (plano personalizado usa o valor próprio)
export function postsDoCliente(cliente) {
  if (!cliente) return 0
  if (cliente.plano === 'personalizado') return cliente.posts_personalizado || 0
  return postsDoPlano(cliente.plano)
}
