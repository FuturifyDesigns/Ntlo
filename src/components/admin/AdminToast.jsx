import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, X } from 'lucide-react'

export default function AdminToast({ message, type = 'success', onClose }) {
  useEffect(() => {
    const id = setTimeout(onClose, 4000)
    return () => clearTimeout(id)
  }, [onClose])

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 16 }}
        className="fixed bottom-4 left-4 right-4 z-[70] mx-auto flex max-w-md items-start gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-lg sm:left-auto sm:right-6"
      >
        {type === 'success' ? (
          <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-success" />
        ) : (
          <XCircle size={20} className="mt-0.5 shrink-0 text-error" />
        )}
        <p className="flex-1 text-sm font-medium text-primary">{message}</p>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-muted hover:text-primary"
          aria-label="Dismiss"
        >
          <X size={16} />
        </button>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}
