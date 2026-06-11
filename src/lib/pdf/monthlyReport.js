import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { demandStatusLabels } from '../../pages/client/Demandas'

function formatDate(value) {
  if (!value) return '—'
  const [year, month, day] = value.split('-')
  return `${day}/${month}/${year}`
}

function formatDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('pt-BR')
}

function formatCurrency(value) {
  if (value === null || value === undefined) return '—'
  return Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const approvalStatusLabels = {
  pendente: 'Pendente',
  aprovado: 'Aprovado',
  revisao_solicitada: 'Revisão solicitada',
}

/**
 * Gera o PDF do relatório mensal e dispara o download no navegador.
 * @param {object} report - retorno de getMonthlyReport()
 */
export function generateMonthlyReportPdf(report) {
  const { client, plano, periodo, demands, approvals, summary } = report

  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 40
  let y = 50

  const monthLabel = format(periodo.referenceDate, "MMMM 'de' yyyy", { locale: ptBR })

  // Cabeçalho
  doc.setFontSize(18)
  doc.setFont(undefined, 'bold')
  doc.text('Relatório mensal', margin, y)

  y += 24
  doc.setFontSize(12)
  doc.setFont(undefined, 'normal')
  doc.text(`Cliente: ${client.nome}`, margin, y)

  y += 18
  doc.text(`Período de referência: ${monthLabel}`, margin, y)

  if (plano) {
    y += 18
    doc.text(
      `Plano: ${plano.pacote} (${formatCurrency(plano.valor)}/mês)`,
      margin,
      y
    )
  }

  // Resumo
  y += 30
  doc.setFontSize(13)
  doc.setFont(undefined, 'bold')
  doc.text('Resumo do mês', margin, y)
  doc.setFont(undefined, 'normal')

  y += 10
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Total de demandas', 'A fazer', 'Em andamento', 'Em revisão', 'Entregues']],
    body: [[summary.total, summary.a_fazer, summary.em_andamento, summary.em_revisao, summary.entregue]],
    theme: 'grid',
    styles: { halign: 'center', fontSize: 10 },
    headStyles: { fillColor: [31, 41, 55] },
  })

  y = doc.lastAutoTable.finalY + 24

  // Demandas do mês
  doc.setFontSize(13)
  doc.setFont(undefined, 'bold')
  doc.text('Demandas do período', margin, y)
  doc.setFont(undefined, 'normal')

  y += 10

  if (demands.length === 0) {
    doc.setFontSize(10)
    doc.text('Nenhuma demanda com prazo neste período.', margin, y + 14)
    y += 30
  } else {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Título', 'Tags', 'Responsável', 'Prazo', 'Status']],
      body: demands.map((d) => [
        d.titulo,
        (d.tags ?? []).map((t) => t.nome).join(', ') || '—',
        d.responsavel?.nome ?? '—',
        formatDate(d.prazo),
        demandStatusLabels[d.status] ?? d.status,
      ]),
      theme: 'striped',
      styles: { fontSize: 9, cellWidth: 'wrap' },
      headStyles: { fillColor: [31, 41, 55] },
      columnStyles: { 0: { cellWidth: 160 } },
    })
    y = doc.lastAutoTable.finalY + 24
  }

  // Aprovações
  if (y > doc.internal.pageSize.getHeight() - 120) {
    doc.addPage()
    y = 50
  }

  doc.setFontSize(13)
  doc.setFont(undefined, 'bold')
  doc.text('Aprovações revisadas no período', margin, y)
  doc.setFont(undefined, 'normal')

  y += 10

  if (approvals.length === 0) {
    doc.setFontSize(10)
    doc.text('Nenhuma aprovação revisada neste período.', margin, y + 14)
  } else {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Demanda', 'Resultado', 'Avaliado em', 'Comentário']],
      body: approvals.map((a) => [
        a.demand?.titulo ?? '—',
        approvalStatusLabels[a.status] ?? a.status,
        formatDateTime(a.reviewed_at),
        a.feedback || '—',
      ]),
      theme: 'striped',
      styles: { fontSize: 9, cellWidth: 'wrap' },
      headStyles: { fillColor: [31, 41, 55] },
      columnStyles: { 0: { cellWidth: 140 }, 3: { cellWidth: 180 } },
    })
  }

  // Rodapé com data de geração
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(
      `Gerado em ${new Date().toLocaleString('pt-BR')}`,
      margin,
      doc.internal.pageSize.getHeight() - 20
    )
    doc.text(
      `Página ${i} de ${pageCount}`,
      pageWidth - margin,
      doc.internal.pageSize.getHeight() - 20,
      { align: 'right' }
    )
  }

  const fileMonth = format(periodo.referenceDate, 'yyyy-MM')
  const fileName = `relatorio-${client.nome.toLowerCase().replace(/\s+/g, '-')}-${fileMonth}.pdf`
  doc.save(fileName)
}
