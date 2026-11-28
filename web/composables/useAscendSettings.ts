import type { AscendLocale } from '~/utils/i18nCopy'
import {
  CONFIDENCE_BY_LOCALE,
  LABEL_TEXT_BY_LOCALE,
  SETTINGS_COPY,
  formatAreaNameByLocale,
  translateFactorByLocale,
} from '~/utils/i18nCopy'
import { getHomeCopy } from '~/utils/uiCopy'

export type MapThemeMode = 'dark' | 'light'

interface PersistedSettings {
  locale: AscendLocale
  mapTheme: MapThemeMode
  calmMotion: boolean
  showHoverPreview: boolean
  autoZoomOnSelect: boolean
  showNeighborRing: boolean
}

const STORAGE_KEY = 'ascend_settings_v1'

export function useAscendSettings() {
  const locale = useState<AscendLocale>('ascend-locale', () => 'en')
  const mapTheme = useState<MapThemeMode>('ascend-map-theme', () => 'dark')
  const calmMotion = useState<boolean>('ascend-calm-motion', () => false)
  const showHoverPreview = useState<boolean>('ascend-hover-preview', () => true)
  const autoZoomOnSelect = useState<boolean>('ascend-auto-zoom', () => true)
  const showNeighborRing = useState<boolean>('ascend-neighbor-ring', () => true)
  const hydrated = useState<boolean>('ascend-settings-hydrated', () => false)

  function applyDocumentAttrs() {
    if (import.meta.server || typeof document === 'undefined') return
    document.documentElement.lang = locale.value
    document.documentElement.classList.toggle('ascend-calm-motion', calmMotion.value)
  }

  function persist() {
    if (import.meta.server) return
    try {
      const payload: PersistedSettings = {
        locale: locale.value,
        mapTheme: mapTheme.value,
        calmMotion: calmMotion.value,
        showHoverPreview: showHoverPreview.value,
        autoZoomOnSelect: autoZoomOnSelect.value,
        showNeighborRing: showNeighborRing.value,
      }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch {
      // Ignore storage quota / private mode failures cleanly
    }
    applyDocumentAttrs()
  }

  function load() {
    if (import.meta.server || hydrated.value) return
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersistedSettings>
        if (parsed.locale === 'en' || parsed.locale === 'id') locale.value = parsed.locale
        if (parsed.mapTheme === 'dark' || parsed.mapTheme === 'light') mapTheme.value = parsed.mapTheme
        if (typeof parsed.calmMotion === 'boolean') calmMotion.value = parsed.calmMotion
        if (typeof parsed.showHoverPreview === 'boolean') showHoverPreview.value = parsed.showHoverPreview
        if (typeof parsed.autoZoomOnSelect === 'boolean') autoZoomOnSelect.value = parsed.autoZoomOnSelect
        if (typeof parsed.showNeighborRing === 'boolean') showNeighborRing.value = parsed.showNeighborRing
      }
    } catch {
      // Keep clean defaults
    } finally {
      hydrated.value = true
      applyDocumentAttrs()
    }
  }

  function setLocale(next: AscendLocale) {
    locale.value = next
    persist()
  }

  function setMapTheme(next: MapThemeMode) {
    mapTheme.value = next
    persist()
  }

  function setCalmMotion(next: boolean) {
    calmMotion.value = next
    persist()
  }

  function setShowHoverPreview(next: boolean) {
    showHoverPreview.value = next
    persist()
  }

  function setAutoZoomOnSelect(next: boolean) {
    autoZoomOnSelect.value = next
    persist()
  }

  function setShowNeighborRing(next: boolean) {
    showNeighborRing.value = next
    persist()
  }

  const isId = computed(() => locale.value === 'id')
  const isMapLight = computed(() => mapTheme.value === 'light')
  const homeCopy = computed(() => getHomeCopy(locale.value))
  const settingsCopy = computed(() => SETTINGS_COPY[locale.value])
  const labelText = computed(() => LABEL_TEXT_BY_LOCALE[locale.value])
  const confidenceText = computed(() => CONFIDENCE_BY_LOCALE[locale.value])

  function t(enText: string, idText: string): string {
    return locale.value === 'id' ? idText : enText
  }

  return {
    locale,
    mapTheme,
    calmMotion,
    showHoverPreview,
    autoZoomOnSelect,
    showNeighborRing,
    isId,
    isMapLight,
    homeCopy,
    settingsCopy,
    labelText,
    confidenceText,
    load,
    setLocale,
    setMapTheme,
    setCalmMotion,
    setShowHoverPreview,
    setAutoZoomOnSelect,
    setShowNeighborRing,
    t,
    translateFactor: (text: string) => translateFactorByLocale(text, locale.value),
    formatAreaName: (name: 'kota_bandung' | 'telkom_area') => formatAreaNameByLocale(name, locale.value),
  }
}
