// Detecção de tipo de mídia por extensão do nome/url do arquivo.

export function isImagem(att) {
  return /\.(png|jpe?g|gif|webp|avif|bmp|svg)$/i.test(att?.nome_arquivo || att?.arquivo_url || '')
}

export function isVideo(att) {
  return /\.(mp4|mov|m4v|webm|ogv|avi|mkv|3gp)$/i.test(att?.nome_arquivo || att?.arquivo_url || '')
}

export function isMidia(att) {
  return isImagem(att) || isVideo(att)
}
