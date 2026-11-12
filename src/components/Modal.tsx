import { useEffect, useId, useRef, type ReactNode } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

/**
 * Accessible modal built on the native <dialog>: it traps focus, closes on Esc,
 * restores focus to the button that opened it and is announced by screen readers.
 */
export function Modal({ open, onClose, title, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    else if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog
      ref={ref} className="modal" aria-labelledby={titleId}
      onClose={onClose} // fires on Esc as well as on our own close()
      onClick={(e) => { if (e.target === ref.current) onClose() }} // click on the backdrop
    >
      <div className="modal-body">
        <div className="modal-head">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">X</button>
        </div>
        {children}
      </div>
    </dialog>
  )
}
