import type { AreaLabel } from '~/types/areas'

export interface ShortlistItem {
  h3: string
  kecamatan: string | null
  label: AreaLabel
  actual_k1: number
  expected_k1: number
  center: [number, number]
}

const STORAGE_KEY = 'ascend_shortlist_v1'
const MAX_SHORTLIST = 10

export function useShortlist() {
  const items = useState<ShortlistItem[]>('ascend-shortlist', () => [])
  const storageAvailable = useState<boolean>('ascend-storage-ok', () => true)
  const hydrated = useState<boolean>('ascend-shortlist-hydrated', () => false)

  function load() {
    if (import.meta.server || hydrated.value) return
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) {
          items.value = parsed.slice(0, MAX_SHORTLIST)
        }
      }
      storageAvailable.value = true
    }
    catch {
      storageAvailable.value = false
    }
    finally {
      hydrated.value = true
    }
  }

  function persist() {
    if (import.meta.server) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value))
      storageAvailable.value = true
    }
    catch {
      storageAvailable.value = false
    }
  }

  function isSaved(h3: string): boolean {
    return items.value.some(item => item.h3 === h3)
  }

  function toggle(item: ShortlistItem): { added: boolean; limitReached: boolean } {
    if (isSaved(item.h3)) {
      items.value = items.value.filter(entry => entry.h3 !== item.h3)
      persist()
      return { added: false, limitReached: false }
    }
    if (items.value.length >= MAX_SHORTLIST) {
      return { added: false, limitReached: true }
    }
    items.value = [item, ...items.value]
    persist()
    return { added: true, limitReached: false }
  }

  function remove(h3: string) {
    items.value = items.value.filter(entry => entry.h3 !== h3)
    persist()
  }

  function clearAll() {
    items.value = []
    persist()
  }

  return {
    items,
    maxItems: MAX_SHORTLIST,
    storageAvailable,
    load,
    isSaved,
    toggle,
    remove,
    clearAll,
  }
}
