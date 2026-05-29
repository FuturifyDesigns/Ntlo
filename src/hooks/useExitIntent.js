import { useCallback, useEffect, useRef, useState } from 'react'

const SESSION_KEY = 'ntlo_exit_intent_dismissed'
const MIN_TIME_MS = 5000

export function useExitIntent({ enabled = true } = {}) {
  const [open, setOpen] = useState(false)
  const allowLeaveRef = useRef(false)
  const readyRef = useRef(false)
  const mountedAtRef = useRef(Date.now())

  const dismiss = useCallback(() => {
    sessionStorage.setItem(SESSION_KEY, '1')
    setOpen(false)
  }, [])

  const stay = useCallback(() => {
    sessionStorage.setItem(SESSION_KEY, '1')
    setOpen(false)
  }, [])

  const confirmLeave = useCallback(() => {
    allowLeaveRef.current = true
    sessionStorage.setItem(SESSION_KEY, '1')
    setOpen(false)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      readyRef.current = true
    }, MIN_TIME_MS)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!enabled) return undefined

    function canShow() {
      return (
        readyRef.current &&
        !sessionStorage.getItem(SESSION_KEY) &&
        !allowLeaveRef.current &&
        Date.now() - mountedAtRef.current >= MIN_TIME_MS
      )
    }

    function onMouseLeave(e) {
      if (!canShow()) return
      if (e.clientY > 12) return
      setOpen(true)
    }

    function onBeforeUnload(e) {
      if (allowLeaveRef.current || sessionStorage.getItem(SESSION_KEY)) return
      if (!readyRef.current) return
      if (Date.now() - mountedAtRef.current < MIN_TIME_MS) return
      e.preventDefault()
      e.returnValue = ''
    }

    document.addEventListener('mouseleave', onMouseLeave)
    window.addEventListener('beforeunload', onBeforeUnload)

    return () => {
      document.removeEventListener('mouseleave', onMouseLeave)
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [enabled])

  return { open, dismiss, stay, confirmLeave, setOpen }
}
