import { useEffect, useRef, useState } from 'react'

const BOX = 256

export default function PhotoCropModal({ src, onCancel, onApply }) {
  const imgRef = useRef(null)
  const [natural, setNatural] = useState(null)
  const [baseScale, setBaseScale] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const drag = useRef(null)

  const scale = baseScale * zoom
  const w = natural ? natural.w * scale : 0
  const h = natural ? natural.h * scale : 0

  function clamp(o, width, height) {
    const minX = BOX - width
    const minY = BOX - height
    return {
      x: Math.min(0, Math.max(minX, o.x)),
      y: Math.min(0, Math.max(minY, o.y)),
    }
  }

  function handleLoad(e) {
    const w0 = e.target.naturalWidth
    const h0 = e.target.naturalHeight
    const base = Math.max(BOX / w0, BOX / h0)
    setNatural({ w: w0, h: h0 })
    setBaseScale(base)
    setZoom(1)
    const width = w0 * base
    const height = h0 * base
    setOffset({ x: (BOX - width) / 2, y: (BOX - height) / 2 })
  }

  useEffect(() => {
    if (natural) setOffset((o) => clamp(o, w, h))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom])

  function onPointerDown(e) {
    drag.current = { sx: e.clientX, sy: e.clientY, ox: offset.x, oy: offset.y }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function onPointerMove(e) {
    if (!drag.current) return
    const nx = drag.current.ox + (e.clientX - drag.current.sx)
    const ny = drag.current.oy + (e.clientY - drag.current.sy)
    setOffset(clamp({ x: nx, y: ny }, w, h))
  }
  function onPointerUp() {
    drag.current = null
  }

  function apply() {
    const canvas = document.createElement('canvas')
    canvas.width = BOX
    canvas.height = BOX
    const ctx = canvas.getContext('2d')
    ctx.drawImage(imgRef.current, offset.x, offset.y, w, h)
    onApply(canvas.toDataURL('image/jpeg', 0.9))
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#13101c]/95 backdrop-blur-2xl p-6 shadow-2xl shadow-black/50">
        <h3 className="mb-4 text-lg font-normal text-white">Ajustar foto</h3>

        <div
          className="relative mx-auto overflow-hidden rounded-full border border-white/10 bg-black/40 cursor-grab active:cursor-grabbing"
          style={{ width: BOX, height: BOX }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <img
            ref={imgRef}
            src={src}
            alt="Pré-visualização"
            onLoad={handleLoad}
            draggable={false}
            style={{
              position: 'absolute',
              left: offset.x,
              top: offset.y,
              width: w || 'auto',
              height: h || 'auto',
              maxWidth: 'none',
              userSelect: 'none',
            }}
          />
        </div>

        <div className="mt-5 flex items-center gap-3">
          <span className="text-xs text-neutral-400">Zoom</span>
          <input
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="flex-1 accent-yellow-400"
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-white/15 px-4 py-2 text-sm text-neutral-300 hover:bg-white/5 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={apply}
            className="rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-yellow-500 transition-colors"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  )
}
