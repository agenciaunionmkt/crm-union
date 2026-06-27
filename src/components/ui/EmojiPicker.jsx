import { useEffect, useRef, useState } from 'react'
import { Smile } from 'lucide-react'

const EMOJIS = [
  '😀', '😁', '😂', '🤣', '😊', '😍', '😎', '🥳',
  '👍', '👏', '🙏', '🔥', '✨', '🎉', '💡', '✅',
  '❌', '⚠️', '📈', '💰', '🛒', '📅', '⏰', '📌',
  '📷', '🎥', '🎨', '✏️', '📝', '💬', '❤️', '🤝',
  '🚀', '⭐', '🙌', '👀', '😅', '🤔', '😉', '💪',
]

export default function EmojiPicker({ onSelect, openUp = true }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Emoji"
        className="inline-flex items-center justify-center rounded-lg border border-white/15 px-2.5 py-2.5 text-subtle hover:bg-white/5 transition-colors"
      >
        <Smile className="w-4 h-4" />
      </button>
      {open && (
        <div
          className={`absolute left-0 z-50 w-56 rounded-lg border border-border bg-surface p-2 shadow-xl shadow-black/50 ${
            openUp ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
        >
          <div className="grid grid-cols-8 gap-1">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => {
                  onSelect(e)
                  setOpen(false)
                }}
                className="rounded p-1 text-lg leading-none hover:bg-white/10"
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
