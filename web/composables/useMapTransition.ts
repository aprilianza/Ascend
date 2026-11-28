export type MapTransitionMode = 'enter-map' | 'exit-map'

interface TransitionStore {
  visible: Ref<boolean>
  mode: Ref<MapTransitionMode>
  progress: Ref<number>
  mapReady: Ref<boolean>
  runId: Ref<number>
}

let store: TransitionStore | null = null
let rafId: number | null = null
let settleTimer: ReturnType<typeof setTimeout> | null = null
let activeRunToken = 0

function getStore(): TransitionStore {
  if (!store) {
    store = {
      visible: ref<boolean>(false),
      mode: ref<MapTransitionMode>('enter-map'),
      progress: ref<number>(0),
      mapReady: ref<boolean>(false),
      runId: ref<number>(0),
    }
  }
  return store
}

function clearTimers() {
  if (rafId !== null && typeof window !== 'undefined') {
    window.cancelAnimationFrame(rafId)
    rafId = null
  }
  if (settleTimer !== null) {
    clearTimeout(settleTimer)
    settleTimer = null
  }
}

export function useMapTransition() {
  const s = getStore()

  function finishTransition(token: number, holdMs: number) {
    if (token !== activeRunToken) return
    s.progress.value = 100
    settleTimer = setTimeout(() => {
      if (token !== activeRunToken) return
      s.visible.value = false
    }, holdMs)
  }

  function startEnterMap() {
    if (typeof window === 'undefined') return
    clearTimers()
    activeRunToken += 1
    const token = activeRunToken

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    s.mode.value = 'enter-map'
    s.mapReady.value = false
    s.progress.value = reduced ? 100 : 3
    s.runId.value += 1
    s.visible.value = true

    if (reduced) {
      settleTimer = setTimeout(() => {
        if (token === activeRunToken) s.visible.value = false
      }, 360)
      return
    }

    // Patient, engaging ramp that genuinely waits until Bandung map tiles + 1,976 hexagons finish rendering
    const startTime = performance.now()
    const minRampMs = 2300
    const maxWaitMs = 7200
    let finishing = false
    let finishStart = 0
    let finishFrom = 88

    const step = (now: number) => {
      if (token !== activeRunToken) return
      const elapsed = now - startTime

      if (!finishing) {
        // Organic climb 3% -> 86% across minRampMs, then calm crawl toward 95% until map idle fires
        const t = Math.min(1, elapsed / minRampMs)
        const eased = 1 - Math.pow(1 - t, 2.2)
        const crawl = elapsed > minRampMs
          ? Math.min(9, ((elapsed - minRampMs) / 3600) * 9)
          : 0
        s.progress.value = Math.min(95, 3 + eased * 83 + crawl)

        const readyToComplete = (elapsed >= minRampMs && s.mapReady.value) || elapsed >= maxWaitMs
        if (readyToComplete) {
          finishing = true
          finishStart = now
          finishFrom = s.progress.value
        }
      } else {
        // Crisp 380ms surge to 100% igniting the Amber X target + 280ms celebratory settle
        const ft = Math.min(1, (now - finishStart) / 380)
        const feased = 1 - Math.pow(1 - ft, 3)
        s.progress.value = finishFrom + (100 - finishFrom) * feased
        if (ft >= 1) {
          rafId = null
          finishTransition(token, 280)
          return
        }
      }

      rafId = window.requestAnimationFrame(step)
    }

    rafId = window.requestAnimationFrame(step)
  }

  function startExitMap() {
    if (typeof window === 'undefined') return
    clearTimers()
    activeRunToken += 1
    const token = activeRunToken

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    s.mode.value = 'exit-map'
    s.mapReady.value = true
    s.progress.value = reduced ? 100 : 6
    s.runId.value += 1
    s.visible.value = true

    if (reduced) {
      settleTimer = setTimeout(() => {
        if (token === activeRunToken) s.visible.value = false
      }, 240)
      return
    }

    // Balanced exit cadence (~1.25s sweep + 220ms hold): unhurried enough to appreciate, never sluggish
    const startTime = performance.now()
    const durationMs = 1250

    const step = (now: number) => {
      if (token !== activeRunToken) return
      const t = Math.min(1, (now - startTime) / durationMs)
      const eased = 1 - Math.pow(1 - t, 2.4)
      s.progress.value = 6 + eased * 94
      if (t >= 1) {
        rafId = null
        finishTransition(token, 220)
        return
      }
      rafId = window.requestAnimationFrame(step)
    }

    rafId = window.requestAnimationFrame(step)
  }

  function notifyMapReady() {
    s.mapReady.value = true
  }

  function forceClose() {
    clearTimers()
    activeRunToken += 1
    s.visible.value = false
  }

  return {
    visible: s.visible,
    mode: s.mode,
    progress: s.progress,
    mapReady: s.mapReady,
    runId: s.runId,
    startEnterMap,
    startExitMap,
    notifyMapReady,
    forceClose,
  }
}
