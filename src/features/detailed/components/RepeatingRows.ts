import { useEffect, useRef, useState } from 'react'

/**
 * Below `lg` a repeating row is a collapsed summary that opens in place; a row the
 * user has just added opens itself, because they added it in order to fill it in.
 * From `lg` up every row is always open and this state is inert.
 */
export function useNewestRowOpen(ids: readonly string[]) {
  const [openId, setOpenId] = useState<string | null>(ids[0] ?? null)
  const previousCount = useRef(ids.length)

  useEffect(() => {
    if (ids.length > previousCount.current) {
      setOpenId(ids[ids.length - 1] ?? null)
    }
    previousCount.current = ids.length
  }, [ids])

  return {
    openId,
    isOpen: (id: string) => openId === id,
    toggle: (id: string) => setOpenId((current) => (current === id ? null : id)),
  }
}
