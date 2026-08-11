import { jsPDF } from 'jspdf'

// Gera o PDF do contrato padrão da Union já preenchido e devolve um File,
// pronto para o fluxo de envio ao Autentique (createContract).
//
// dados = {
//   contratante: { nome, qualificacao, docLabel, doc, endereco, cep?, cidade },
//   escopo: [linha, ...],
//   vigencia: { prazo, inicio, fim },
//   valorNum, valorExt, pagDia, pagPrimeiro,
//   assinaturaNome, assinaturaDoc,
// }
export function gerarContratoPDF(dados) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const M = 56               // margem
  const W = 595.28           // largura A4 em pt
  const H = 841.89           // altura A4 em pt
  const maxW = W - M * 2
  let y = M

  function quebraPagina(alturaNecessaria) {
    if (y + alturaNecessaria > H - M) {
      doc.addPage()
      y = M
    }
  }

  function paragrafo(texto, opts = {}) {
    const size = opts.size ?? 10.5
    const lh = size * 1.35
    doc.setFont('helvetica', opts.bold ? 'bold' : opts.italic ? 'italic' : 'normal')
    doc.setFontSize(size)
    const linhas = doc.splitTextToSize(texto, maxW)
    for (const linha of linhas) {
      quebraPagina(lh)
      const x = opts.align === 'center' ? W / 2 : M
      doc.text(linha, x, y, { align: opts.align === 'center' ? 'center' : 'left' })
      y += lh
    }
    y += opts.gap ?? 6
  }

  function titulo() {
    paragrafo('CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE MARKETING DIGITAL', { bold: true, size: 13, align: 'center', gap: 2 })
    paragrafo('Social Media, Gestão de Tráfego e Posicionamento Digital', { italic: true, size: 10, align: 'center', gap: 12 })
  }

  function assinatura(nome, linha2) {
    quebraPagina(60)
    y += 10
    doc.setDrawColor(0)
    doc.line(W / 2 - 150, y, W / 2 + 150, y)
    y += 14
    paragrafo(nome, { bold: true, align: 'center', gap: 2 })
    paragrafo(linha2, { align: 'center', gap: 18 })
  }

  const c = dados.contratante
  const enderecoLinha = c.cep
    ? `${c.endereco}, CEP ${c.cep}, ${c.cidade}`
    : `${c.endereco}, ${c.cidade}`

  titulo()

  paragrafo(
    'CONTRATADA: REGINALDO DE SOUZA ALMEIDA JUNIOR - ME, pessoa jurídica de direito privado, inscrita no CNPJ sob nº 26.852.248/0001-74, com sede na Av. Presidente Getúlio Vargas, 2396, Sala C, Santa Rita, CEP 68.901-262, Macapá/AP, doravante denominada CONTRATADA;'
  )
  paragrafo(
    `CONTRATANTE: ${c.nome}, ${c.qualificacao}, inscrita no ${c.docLabel} sob nº ${c.doc}, com endereço na ${enderecoLinha}, doravante denominada CONTRATANTE.`
  )
  paragrafo(
    'As partes acima identificadas têm, entre si, justo e acordado o presente Contrato de Prestação de Serviços de Marketing Digital, que se regerá pelas cláusulas e condições a seguir, em conformidade com a legislação brasileira.'
  )

  paragrafo('CLÁUSULA 1ª - DO OBJETO', { bold: true, gap: 4 })
  paragrafo('1.1. O presente contrato tem por objeto a prestação, pela CONTRATADA, de serviços de marketing digital, abrangendo gestão de redes sociais, produção de conteúdo, gestão de tráfego pago e posicionamento digital, conforme o escopo detalhado na Cláusula 2ª e na proposta comercial previamente aprovada pela CONTRATANTE.')

  paragrafo('CLÁUSULA 2ª - DO ESCOPO DOS SERVIÇOS', { bold: true, gap: 4 })
  paragrafo('2.1. Os serviços compreendem, a cada mês de vigência:')
  for (const item of dados.escopo) paragrafo(item, { gap: 3 })
  paragrafo('2.2. O pacote mensal contempla os quantitativos descritos acima. Demandas excedentes serão objeto de orçamento à parte, mediante aprovação prévia da CONTRATANTE.')

  paragrafo('CLÁUSULA 3ª - DA VERBA DE ANÚNCIOS', { bold: true, gap: 4 })
  paragrafo('3.1. A remuneração prevista neste contrato refere-se exclusivamente aos serviços de criação e gestão. A verba destinada ao investimento em anúncios (orçamento de campanha / mídia paga) NÃO está inclusa e será custeada integralmente pela CONTRATANTE.')
  paragrafo('3.2. O valor da verba de anúncios será definido em conjunto pelas partes, cabendo à CONTRATANTE disponibilizar os fundos necessários à veiculação das campanhas.')

  paragrafo('CLÁUSULA 4ª - DA NATUREZA DA OBRIGAÇÃO', { bold: true, gap: 4 })
  paragrafo('4.1. Os serviços constituem obrigação de meio, e não de resultado. A CONTRATADA empregará as melhores técnicas e a devida diligência, mas não garante resultados específicos de vendas, alcance, número de seguidores, conversões ou desempenho de campanhas, por dependerem de fatores externos, tais como algoritmos das plataformas, comportamento de mercado, verba investida e atuação da própria CONTRATANTE.')

  paragrafo('CLÁUSULA 5ª - DAS OBRIGAÇÕES DA CONTRATADA', { bold: true, gap: 4 })
  paragrafo('a) Executar os serviços com qualidade técnica e zelo profissional;', { gap: 3 })
  paragrafo('b) Produzir o conteúdo conforme o escopo e o tom de voz definidos;', { gap: 3 })
  paragrafo('c) Submeter os materiais à aprovação da CONTRATANTE antes da publicação, quando aplicável;', { gap: 3 })
  paragrafo('d) Observar o Código de Defesa do Consumidor e as normas de publicidade na criação dos materiais;', { gap: 3 })
  paragrafo('e) Disponibilizar relatórios periódicos de desempenho;', { gap: 3 })
  paragrafo('f) Manter sigilo sobre as informações da CONTRATANTE, nos termos da Cláusula 13ª;', { gap: 3 })
  paragrafo('g) Tratar os dados pessoais a que tiver acesso conforme a Cláusula 12ª.')

  paragrafo('CLÁUSULA 6ª - DAS OBRIGAÇÕES DA CONTRATANTE', { bold: true, gap: 4 })
  paragrafo('a) Fornecer, em até 72 (setenta e duas) horas, as informações, materiais e aprovações necessárias ao desenvolvimento dos serviços, evitando atrasos no cronograma;', { gap: 3 })
  paragrafo('b) Disponibilizar o acesso às contas necessárias na forma da Cláusula 7ª;', { gap: 3 })
  paragrafo('c) Efetuar os pagamentos nas datas acordadas;', { gap: 3 })
  paragrafo('d) Fornecer informações verídicas e comprováveis sobre seus produtos e serviços, respondendo, civil e criminalmente, pelo conteúdo que fornecer, bem como por propaganda enganosa e por violação de direitos autorais ou de imagem decorrentes de material por ela disponibilizado;', { gap: 3 })
  paragrafo('e) Custear a verba de anúncios, nos termos da Cláusula 3ª.')

  paragrafo('CLÁUSULA 7ª - DO ACESSO ÀS CONTAS E CREDENCIAIS', { bold: true, gap: 4 })
  paragrafo('7.1. O acesso às contas de anúncios e redes sociais dar-se-á, preferencialmente, por meio de ferramentas oficiais de gestão (por exemplo, Meta Business Manager), mediante concessão de permissão, sem compartilhamento de senhas, em conformidade com os termos de uso das plataformas e com as boas práticas de segurança da informação.')
  paragrafo('7.2. Eventuais credenciais compartilhadas serão tratadas de forma confidencial e utilizadas exclusivamente para a execução dos serviços.')

  paragrafo('CLÁUSULA 8ª - DA PRODUÇÃO E APROVAÇÃO DE CONTEÚDO', { bold: true, gap: 4 })
  paragrafo('8.1. A CONTRATANTE deverá enviar os materiais e informações necessários com antecedência mínima de 72 (setenta e duas) horas da data prevista de publicação.')
  paragrafo('8.2. Os quantitativos mensais são vinculados ao mês de referência e não são cumulativos: itens não produzidos por ausência de envio tempestivo de materiais ou de aprovação pela CONTRATANTE, dentro do mês, não serão transferidos para os meses seguintes, sem prejuízo da remuneração devida.')
  paragrafo('8.3. A CONTRATANTE poderá solicitar ajustes razoáveis nos materiais. Alterações que descaracterizem peça já aprovada poderão ser tratadas como nova demanda.')

  paragrafo('CLÁUSULA 9ª - DO PRAZO DE VIGÊNCIA', { bold: true, gap: 4 })
  paragrafo(`9.1. O presente contrato vigorará pelo prazo de ${dados.vigencia.prazo}, com início em ${dados.vigencia.inicio} e término em ${dados.vigencia.fim}.`)
  paragrafo('9.2. Ao final do prazo, o contrato poderá ser renovado mediante acordo entre as partes, formalizado por escrito ou por meio eletrônico.')

  paragrafo('CLÁUSULA 10ª - DO VALOR E DA FORMA DE PAGAMENTO', { bold: true, gap: 4 })
  paragrafo(`10.1. Pela prestação dos serviços, a CONTRATANTE pagará à CONTRATADA o valor mensal de ${dados.valorNum} (${dados.valorExt}).`)
  paragrafo(`10.2. O pagamento será realizado de forma integral, via PIX ou transferência bancária, todo dia ${dados.pagDia} de cada mês, sendo o primeiro pagamento em ${dados.pagPrimeiro}.`)
  paragrafo('10.3. O atraso no pagamento sujeitará a CONTRATANTE a multa de 2% (dois por cento) sobre o valor em atraso, juros de mora de 1% (um por cento) ao mês e atualização monetária, sem prejuízo da suspensão dos serviços e da rescisão prevista na Cláusula 14ª.')

  paragrafo('CLÁUSULA 11ª - DA PROPRIEDADE INTELECTUAL E DIREITO DE IMAGEM', { bold: true, gap: 4 })
  paragrafo('11.1. Os materiais efetivamente entregues e pagos no âmbito deste contrato poderão ser livremente utilizados pela CONTRATANTE em seus canais, ficando-lhe assegurada a respectiva licença de uso.')
  paragrafo('11.2. A CONTRATADA conserva a titularidade sobre sua metodologia, processos e know-how, podendo utilizar os trabalhos desenvolvidos em seu portfólio e meios de divulgação, ressalvadas as informações sigilosas da CONTRATANTE.')
  paragrafo('11.3. Imagens, áudios e demais materiais de terceiros eventualmente utilizados serão de uso livre, licenciados ou provenientes de bancos autorizados. A CONTRATANTE responde pela titularidade e pela regularidade do material que fornecer.')

  paragrafo('CLÁUSULA 12ª - DA PROTEÇÃO DE DADOS (LGPD)', { bold: true, gap: 4 })
  paragrafo('12.1. As partes obrigam-se a cumprir a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados - LGPD).')
  paragrafo('12.2. Para os fins deste contrato, a CONTRATANTE atua como controladora e a CONTRATADA como operadora dos dados pessoais tratados em razão da execução dos serviços, os quais serão tratados exclusivamente conforme as finalidades aqui previstas e as instruções da CONTRATANTE.')
  paragrafo('12.3. A CONTRATADA adotará medidas de segurança adequadas e não compartilhará os dados com terceiros, salvo suboperadores necessários à execução (por exemplo, plataformas de anúncios e ferramentas de gestão), mantida a finalidade.')
  paragrafo('12.4. Encerrado o contrato, a CONTRATADA eliminará ou devolverá os dados pessoais à CONTRATANTE, salvo obrigação legal de retenção.')

  paragrafo('CLÁUSULA 13ª - DA CONFIDENCIALIDADE', { bold: true, gap: 4 })
  paragrafo('13.1. As partes manterão sigilo sobre as informações confidenciais a que tiverem acesso (estratégias, dados, credenciais e resultados), durante a vigência e pelo prazo de 2 (dois) anos após o término do contrato, ressalvadas as informações públicas ou cuja divulgação seja exigida por lei ou autoridade competente.')

  paragrafo('CLÁUSULA 14ª - DA RESCISÃO', { bold: true, gap: 4 })
  paragrafo('14.1. Qualquer das partes poderá rescindir o presente contrato, de forma imotivada, mediante aviso prévio de 30 (trinta) dias, sem incidência de qualquer multa rescisória.')
  paragrafo('14.2. O contrato poderá ser rescindido de pleno direito, independentemente de aviso, em caso de descumprimento de obrigação contratual não sanado em 10 (dez) dias após notificação, ou de inadimplemento de pagamento.')
  paragrafo('14.3. Não haverá restituição de valores referentes a serviços já prestados ou ao mês em curso, permanecendo devidos os valores correspondentes aos serviços efetivamente executados até a data da rescisão.')

  paragrafo('CLÁUSULA 15ª - DAS DISPOSIÇÕES GERAIS', { bold: true, gap: 4 })
  paragrafo('15.1. As partes são independentes entre si, não havendo vínculo empregatício, societário ou de representação, não podendo uma obrigar-se em nome da outra.')
  paragrafo('15.2. A CONTRATADA poderá, sob sua responsabilidade, valer-se de terceiros para a execução de partes dos serviços, mantida a qualidade contratada.')
  paragrafo('15.3. A tolerância de qualquer das partes quanto ao descumprimento de obrigação não implica novação ou renúncia de direitos, que poderão ser exercidos a qualquer tempo.')
  paragrafo('15.4. Aplicam-se a este contrato o Código Civil, a Lei nº 9.610/98 (Direitos Autorais), a Lei nº 13.709/2018 (LGPD), o Código de Defesa do Consumidor e as normas de publicidade aplicáveis.')
  paragrafo('15.5. Alterações somente serão válidas mediante termo aditivo escrito ou eletrônico.')

  paragrafo('CLÁUSULA 16ª - DA ASSINATURA ELETRÔNICA', { bold: true, gap: 4 })
  paragrafo('16.1. As partes reconhecem a validade da assinatura eletrônica deste contrato, nos termos da MP 2.200-2/2001 e da Lei nº 14.063/2020, conferindo-lhe igual valor jurídico ao da assinatura manuscrita.')

  paragrafo('CLÁUSULA 17ª - DO FORO', { bold: true, gap: 4 })
  paragrafo('17.1. Fica eleito o foro da Comarca de Macapá/AP para dirimir quaisquer controvérsias oriundas deste contrato, com renúncia a qualquer outro, por mais privilegiado que seja.')

  paragrafo('E, por estarem assim justas e contratadas, as partes assinam o presente instrumento eletronicamente, em via única de igual teor.', { gap: 10 })
  paragrafo('Macapá/AP, na data da assinatura eletrônica.', { align: 'center', gap: 24 })

  assinatura('REGINALDO DE SOUZA ALMEIDA JUNIOR - ME', 'CONTRATADA - CNPJ nº 26.852.248/0001-74')
  assinatura(dados.assinaturaNome, dados.assinaturaDoc)

  const blob = doc.output('blob')
  const nomeArquivo = `Contrato - ${c.nome}.pdf`.replace(/[^\w.\- ]+/g, '')
  return new File([blob], nomeArquivo, { type: 'application/pdf' })
}
