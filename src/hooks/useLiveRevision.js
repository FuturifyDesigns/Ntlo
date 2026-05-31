import { useEffect, useRef, useState } from 'react'

/** Bumps revision when advisor inputs change — drives live UI refresh labels. */
export function useLiveRevision(deps) {
  const [revision, setRevision] = useState(0)
  const [lastChangeAt, setLastChangeAt] = useState(null)
  const isFirst = useRef(true)

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false
      return
    }
    setRevision((n) => n + 1)
    setLastChangeAt(Date.now())
  }, deps)

  const isFresh = lastChangeAt != null && Date.now() - lastChangeAt < 12000

  return { revision, lastChangeAt, isFresh }
}
