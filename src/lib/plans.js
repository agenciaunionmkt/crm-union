// Planos da agência e quantidade de posts por mês.
export const PLANOS = {
  essencial: { label: 'Essencial', posts: 12 },
  master: { label: 'Master', posts: 20 },
  premium: { label: 'Premium', posts: 28 },
}

export function postsDoPlano(plano) {
  return PLANOS[plano]?.posts ?? 0
}

export function labelDoPlano(plano) {
  return PLANOS[plano]?.label ?? '—'
}
