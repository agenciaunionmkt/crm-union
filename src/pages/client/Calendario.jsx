import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../../context/AuthContext'
import { listDemandsByClient } from '../../lib/api/demands'
import { listAttachments } from '../../lib/api/attachments'
import DemandCalendar from '../../components/DemandCalendar'
import DemandActivity from '../../components/DemandActivity'
import Modal from '../../components/Modal'
import { demandStatusLabels, demandStatusStyles } from '../../lib/status'

function formatDate(value) {
  if (!value) return '—'
  const [y, m, d] = value.split('-')
  return `${d}/${m}/${y}`
}

function isImagem(att) {
  return /\.(png|jpe?g|gif|webp|avif|bmp|svg)$/i.test(att.nome_arquivo || att.arquivo_url || '')
}

export default function ClientCalendario() {
  const { profile } = useAuth()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [detalhe, setDetalhe] = useState(null)
  const [expandImg, setExpandImg] = useState(null)

  const { data: demands = [], isLoading } = useQuery({
    queryKey: ['client-demands', profile?.cliente_id],
    queryFn: () => listDemandsByClient(profile.cliente_id),
    enabled: !!profile?.cliente_id,
  })

  const { data: anexos = [] } = useQuery({
    queryKey: ['attachments', detalhe?.id],
    queryFn: () => listAttachments(detalhe.id),
    enabled: !!detalhe?.id,
  })

  const imagens = anexos.filter(isImagem)

  return (
    <div>
      <h1 className="text-2xl font-normal text-white">Calendário de conteúdo</h1>
      <p className="mt-1 text-sm text-neutral-400">Planejamento de publicações do mês</p>

      <div className="mt-6">
        {isLoading ? (
          <p className="text-sm text-neutral-400">Carregando...</p>
        ) : (
          <DemandCalendar
            demands={demands}
            currentMonth={currentMonth}
            onMonthChange={setCurrentMonth}
            onCardClick={(d) => setDetalhe(d)}
          />
        )}
      </div>

      <Modal open={!!detalhe} title="Conteúdo" onClose={() => setDetalhe(null)} maxWidth="max-w-2xl">
        {detalhe && (
          <div className="space-y-5">
            <div>
              <p className="text-lg font-normal text-white">{detalhe.titulo}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-neutral-400">
                {detalhe.status && (
                  <span className={`inline-flex rounded-full px-2.5 py-1 ${demandStatusStyles[detalhe.status]}`}>
                    {demandStatusLabels[detalhe.status]}
                  </span>
                )}
                <span>Data: {formatDate(detalhe.prazo)}</span>
              </div>
            </div>

            {/* Conteúdo (imagens em miniatura, clique para ampliar) */}
            <div>
              <p className="mb-2 text-xs uppercase tracking-widest text-neutral-500">Conteúdo</p>
              {imagens.length === 0 ? (
                <p className="text-sm text-neutral-400">Conteúdo ainda não disponível.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {imagens.map((img) => (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => setExpandImg(img.arquivo_url)}
                      className="group relative aspect-square overflow-hidden rounded-lg border border-white/10 bg-white/5"
                      title="Clique para ampliar"
                    >
                      <img
                        src={img.arquivo_url}
                        alt={img.nome_arquivo || 'Conteúdo'}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Comentários do cliente nesta demanda */}
            <div className="border-t border-white/10 pt-4">
              <DemandActivity demandId={detalhe.id} mode="cliente" currentUser={profile} />
            </div>
          </div>
        )}
      </Modal>

      {/* Lightbox de imagem ampliada */}
      {expandImg && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setExpandImg(null)}
          role="presentation"
        >
          <img
            src={expandImg}
            alt="Conteúdo ampliado"
            className="max-h-[90vh] max-w-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setExpandImg(null)}
            className="absolute right-4 top-4 rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20"
          >
            Fechar
          </button>
        </div>
      )}
    </div>
  )
}
