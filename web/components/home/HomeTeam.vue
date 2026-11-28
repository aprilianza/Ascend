<script setup lang="ts">
import type { Component } from 'vue'
import {
  BarChart3,
  Briefcase,
  ChevronDown,
  ClipboardCheck,
  Code2,
  Compass,
  FileSearch,
  Handshake,
  Layers,
  LayoutGrid,
  MapPin,
  Megaphone,
  Monitor,
  Palette,
  PenTool,
  Presentation,
  Search,
  ShieldCheck,
  Sliders,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from 'lucide-vue-next'
const settings = useAscendSettings()
const HOME_COPY = computed(() => settings.homeCopy.value)

type MemberItem = (typeof HOME_COPY.value.team.members)[number]
type ThemeKey = MemberItem['theme']
type IconSetKey = MemberItem['iconSet']

const themeMap: Record<
  ThemeKey,
  {
    primary: string
    light: string
    border: string
    glow: string
    bgWash: string
    pillBg: string
    dropShadow: string
  }
> = {
  emerald: {
    primary: '#10B981',
    light: '#6EE7B7',
    border: 'rgba(16, 185, 129, 0.65)',
    glow: 'rgba(16, 185, 129, 0.34)',
    bgWash: 'radial-gradient(ellipse 80% 72% at 50% 24%, rgba(16, 185, 129, 0.24) 0%, rgba(16, 185, 129, 0.05) 56%, transparent 82%)',
    pillBg: 'rgba(16, 185, 129, 0.14)',
    dropShadow: 'drop-shadow(0 16px 26px rgba(16, 185, 129, 0.32)) drop-shadow(0 8px 18px rgba(0, 0, 0, 0.65))',
  },
  amber: {
    primary: '#F59E0B',
    light: '#FCD34D',
    border: 'rgba(245, 158, 11, 0.65)',
    glow: 'rgba(245, 158, 11, 0.32)',
    bgWash: 'radial-gradient(ellipse 80% 72% at 50% 24%, rgba(245, 158, 11, 0.24) 0%, rgba(245, 158, 11, 0.05) 56%, transparent 82%)',
    pillBg: 'rgba(245, 158, 11, 0.14)',
    dropShadow: 'drop-shadow(0 16px 26px rgba(245, 158, 11, 0.3)) drop-shadow(0 8px 18px rgba(0, 0, 0, 0.65))',
  },
  violet: {
    primary: '#A855F7',
    light: '#D8B4FE',
    border: 'rgba(168, 85, 247, 0.65)',
    glow: 'rgba(168, 85, 247, 0.34)',
    bgWash: 'radial-gradient(ellipse 80% 72% at 50% 24%, rgba(168, 85, 247, 0.24) 0%, rgba(168, 85, 247, 0.05) 56%, transparent 82%)',
    pillBg: 'rgba(168, 85, 247, 0.14)',
    dropShadow: 'drop-shadow(0 16px 26px rgba(168, 85, 247, 0.32)) drop-shadow(0 8px 18px rgba(0, 0, 0, 0.65))',
  },
  rose: {
    primary: '#F43F5E',
    light: '#FDA4AF',
    border: 'rgba(244, 63, 94, 0.65)',
    glow: 'rgba(244, 63, 94, 0.32)',
    bgWash: 'radial-gradient(ellipse 80% 72% at 50% 24%, rgba(244, 63, 94, 0.24) 0%, rgba(244, 63, 94, 0.05) 56%, transparent 82%)',
    pillBg: 'rgba(244, 63, 94, 0.14)',
    dropShadow: 'drop-shadow(0 16px 26px rgba(244, 63, 94, 0.3)) drop-shadow(0 8px 18px rgba(0, 0, 0, 0.65))',
  },
}

const iconSetMap: Record<IconSetKey, Array<{ icon: Component; posClass: string; animClass: string; delay: string }>> = {
  business: [
    { icon: Briefcase, posClass: 'top-6 left-4', animClass: 'team-icon-float-a', delay: '0ms' },
    { icon: Megaphone, posClass: 'top-5 right-4', animClass: 'team-icon-float-b', delay: '120ms' },
    { icon: Handshake, posClass: 'top-[86px] left-3', animClass: 'team-icon-float-b', delay: '200ms' },
    { icon: TrendingUp, posClass: 'top-[88px] right-3', animClass: 'team-icon-float-a', delay: '80ms' },
    { icon: Users, posClass: 'top-[146px] left-5', animClass: 'team-icon-float-a', delay: '160ms' },
    { icon: Presentation, posClass: 'top-[146px] right-5', animClass: 'team-icon-float-b', delay: '260ms' },
  ],
  ml: [
    { icon: Layers, posClass: 'top-6 left-4', animClass: 'team-icon-float-a', delay: '0ms' },
    { icon: Target, posClass: 'top-5 right-4', animClass: 'team-icon-float-b', delay: '120ms' },
    { icon: TrendingUp, posClass: 'top-[86px] left-3', animClass: 'team-icon-float-b', delay: '200ms' },
    { icon: BarChart3, posClass: 'top-[88px] right-3', animClass: 'team-icon-float-a', delay: '80ms' },
    { icon: Sliders, posClass: 'top-[146px] left-5', animClass: 'team-icon-float-a', delay: '160ms' },
    { icon: Compass, posClass: 'top-[146px] right-5', animClass: 'team-icon-float-b', delay: '260ms' },
  ],
  frontend: [
    { icon: Palette, posClass: 'top-6 left-4', animClass: 'team-icon-float-a', delay: '0ms' },
    { icon: PenTool, posClass: 'top-5 right-4', animClass: 'team-icon-float-b', delay: '120ms' },
    { icon: LayoutGrid, posClass: 'top-[86px] left-3', animClass: 'team-icon-float-b', delay: '200ms' },
    { icon: Code2, posClass: 'top-[88px] right-3', animClass: 'team-icon-float-a', delay: '80ms' },
    { icon: Monitor, posClass: 'top-[146px] left-5', animClass: 'team-icon-float-a', delay: '160ms' },
    { icon: Sparkles, posClass: 'top-[146px] right-5', animClass: 'team-icon-float-b', delay: '260ms' },
  ],
  research: [
    { icon: ClipboardCheck, posClass: 'top-6 left-4', animClass: 'team-icon-float-a', delay: '0ms' },
    { icon: Search, posClass: 'top-5 right-4', animClass: 'team-icon-float-b', delay: '120ms' },
    { icon: MapPin, posClass: 'top-[86px] left-3', animClass: 'team-icon-float-b', delay: '200ms' },
    { icon: ShieldCheck, posClass: 'top-[88px] right-3', animClass: 'team-icon-float-a', delay: '80ms' },
    { icon: FileSearch, posClass: 'top-[146px] left-5', animClass: 'team-icon-float-a', delay: '160ms' },
    { icon: Compass, posClass: 'top-[146px] right-5', animClass: 'team-icon-float-b', delay: '260ms' },
  ],
}

const sectionRef = ref<HTMLElement | null>(null)
const activeMemberId = ref<string | null>(null)
const poseIndex = ref<0 | 1>(0)
const reducedMotion = ref(false)
const exitProgress = ref(0)

let poseTimer: ReturnType<typeof setInterval> | null = null
let exitTarget = 0
let exitRafId: number | null = null
let exitLastTs = 0

function measureExitProgress() {
  if (reducedMotion.value || !sectionRef.value) {
    exitTarget = 0
    return
  }
  const rect = sectionRef.value.getBoundingClientRect()
  const vh = window.innerHeight || 900
  // Begin fading out smoothly once the bottom of the Team section crosses 68% of viewport height
  // and finish dissolving right before the Demand Route begins drawing.
  const startY = vh * 0.68
  const endY = vh * 0.16
  const raw = (startY - rect.bottom) / Math.max(1, startY - endY)
  exitTarget = Math.max(0, Math.min(1, raw))
}

function tickExit(ts: number) {
  const dt = exitLastTs ? Math.min(0.05, (ts - exitLastTs) / 1000) : 0.016
  exitLastTs = ts
  const blend = reducedMotion.value ? 1 : 1 - Math.exp(-10 * dt)
  exitProgress.value += (exitTarget - exitProgress.value) * blend
  if (Math.abs(exitTarget - exitProgress.value) < 0.001) {
    exitProgress.value = exitTarget
    exitRafId = null
  } else {
    exitRafId = window.requestAnimationFrame(tickExit)
  }
}

function scheduleExitTick() {
  measureExitProgress()
  if (exitRafId === null) {
    exitLastTs = 0
    exitRafId = window.requestAnimationFrame(tickExit)
  }
}

function clearPoseTimer() {
  if (poseTimer) {
    clearInterval(poseTimer)
    poseTimer = null
  }
}

function startPoseCycle() {
  clearPoseTimer()
  if (reducedMotion.value) return
  poseTimer = setInterval(() => {
    poseIndex.value = poseIndex.value === 0 ? 1 : 0
  }, 1450)
}

function activateMember(id: string) {
  if (activeMemberId.value === id) return
  activeMemberId.value = id
  poseIndex.value = 0
  startPoseCycle()
}

function deactivateMember(id: string) {
  if (activeMemberId.value !== id) return
  clearPoseTimer()
  activeMemberId.value = null
  poseIndex.value = 0
}

function toggleMemberTap(id: string) {
  if (activeMemberId.value === id) {
    poseIndex.value = poseIndex.value === 0 ? 1 : 0
    startPoseCycle()
  } else {
    activateMember(id)
  }
}

onMounted(() => {
  reducedMotion.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  measureExitProgress()
  exitProgress.value = exitTarget
  window.addEventListener('scroll', scheduleExitTick, { passive: true })
  window.addEventListener('resize', scheduleExitTick, { passive: true })
})

onBeforeUnmount(() => {
  clearPoseTimer()
  window.removeEventListener('scroll', scheduleExitTick)
  window.removeEventListener('resize', scheduleExitTick)
  if (exitRafId !== null) window.cancelAnimationFrame(exitRafId)
})

const teamStageStyle = computed(() => {
  if (reducedMotion.value || exitProgress.value <= 0.001) return {}
  const p = exitProgress.value
  return {
    opacity: Math.max(0.05, 1 - p * 0.95),
    transform: `translate3d(0, ${(-p * 24).toFixed(1)}px, 0) scale(${(1 - p * 0.022).toFixed(4)})`,
    filter: p > 0.25 ? `blur(${((p - 0.25) * 4).toFixed(2)}px)` : 'none',
  }
})

const scrollCueStyle = computed(() => {
  if (reducedMotion.value) return {}
  const p = exitProgress.value
  const fade = Math.max(0, 1 - p * 1.65)
  return {
    opacity: fade,
    transform: `translate3d(0, ${(p * 14).toFixed(1)}px, 0)`,
  }
})
</script>

<template>
  <section
    id="tim"
    ref="sectionRef"
    class="relative pt-20 pb-28 sm:pt-28 sm:pb-36 bg-ground bg-signal-dots overflow-x-clip"
  >
    <div
      class="mx-auto max-w-frame px-5 sm:px-8 will-change-[opacity,transform]"
      :style="teamStageStyle"
    >
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-16 sm:mb-20">
        <div>
          <p
            v-reveal="{ variant: 'up' }"
            class="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-mint mb-3"
          >
            <span class="w-1.5 h-1.5 rounded-full bg-mint shadow-[0_0_8px_rgba(16,185,129,0.85)]" aria-hidden="true" />
            <span>{{ HOME_COPY.team.eyebrow }}</span>
          </p>
          <h2 v-reveal="{ variant: 'up', delay: 80 }" class="font-editorial font-semibold text-ink-primary text-[32px] sm:text-[42px] leading-[1.15] tracking-[-0.01em]">
            {{ HOME_COPY.team.headlinePrefix }}
            <span class="editorial-mint">{{ HOME_COPY.team.headlineAccent }}</span>
          </h2>
        </div>
        <div class="flex flex-col sm:items-end gap-1">
          <span class="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-muted">
            4 MEMBERS · ROSUN GANK
          </span>
          <span class="font-mono text-[9.5px] uppercase tracking-[0.14em] text-ink-muted/70">
            Hover or tap any card to meet us
          </span>
        </div>
      </div>

      <!-- 4 Concentric Hexagon Cards -> 3D Pop-Out Dual-Pose Portraits on Hover -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-5 pt-4">
        <div
          v-for="(member, idx) in HOME_COPY.team.members"
          :key="member.id"
          v-reveal="{ variant: 'up', delay: idx * 80 }"
          class="h-full"
        >
          <article
            tabindex="0"
            class="team-member-card group h-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-mint/70"
            :class="[
              activeMemberId === member.id ? 'is-active z-30' : 'z-10 hover:z-30',
            ]"
            :aria-label="`${member.name}, ${member.roleTag}`"
            @mouseenter="activateMember(member.id)"
            @mouseleave="deactivateMember(member.id)"
            @focusin="activateMember(member.id)"
            @focusout="deactivateMember(member.id)"
            @click="toggleMemberTap(member.id)"
          >
            <!-- Clipped Card Shell (Border, Role Glow, Corner Leaf Accents, Concentric Hexagons, Jobdesk Backdrop Icons) -->
            <div
              class="absolute inset-0 rounded-[20px] overflow-hidden transition-all duration-300"
              :style="{
                background: 'linear-gradient(160deg, #131822 0%, #0D1118 58%, #0B0F15 100%)',
                border: activeMemberId === member.id
                  ? `1px solid ${themeMap[member.theme].border}`
                  : '1px solid rgba(38, 47, 62, 0.85)',
                boxShadow: activeMemberId === member.id
                  ? `0 24px 54px rgba(0, 0, 0, 0.58), 0 0 38px ${themeMap[member.theme].glow}, inset 0 1px 0 rgba(255, 255, 255, 0.16)`
                  : '0 14px 36px rgba(0, 0, 0, 0.36), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
              }"
            >
              <!-- Soft Top Radial Role Aura (brightens dramatically on hover) -->
              <div
                class="pointer-events-none absolute inset-0 transition-opacity duration-500"
                :style="{
                  background: themeMap[member.theme].bgWash,
                  opacity: activeMemberId === member.id ? 1 : 0.55,
                }"
                aria-hidden="true"
              />

              <!-- Floating Jobdesk-Specific Icons Behind Portrait (Bloom Smoothly on Hover) -->
              <div
                class="pointer-events-none absolute inset-x-0 top-0 h-[214px] transition-all duration-500"
                :class="activeMemberId === member.id ? 'opacity-100 scale-100' : 'opacity-0 scale-90'"
                aria-hidden="true"
              >
                <span
                  v-for="(ic, icIdx) in iconSetMap[member.iconSet]"
                  :key="icIdx"
                  class="absolute w-8 h-8 rounded-xl flex items-center justify-center backdrop-blur-sm"
                  :class="[ic.posClass, ic.animClass]"
                  :style="{
                    backgroundColor: themeMap[member.theme].pillBg,
                    border: `1px solid ${themeMap[member.theme].border}`,
                    color: themeMap[member.theme].light,
                    boxShadow: `0 0 16px ${themeMap[member.theme].glow}`,
                    transitionDelay: ic.delay,
                  }"
                >
                  <component :is="ic.icon" class="w-4 h-4" :stroke-width="1.8" />
                </span>
              </div>
            </div>

            <!-- Card Foreground Content (Overflow-Visible so Pop-Out Portrait Breaks Cleanly Above the Card Top Border!) -->
            <div class="relative z-10 flex flex-col h-full">
              <!-- Top Visual Stage (Default: Concentric Glowing Hexagon Monogram | Hover: 3D Pop-Out Dual-Pose Portrait) -->
              <div class="relative h-[204px] flex items-center justify-center">
                <!-- Default 3-Layer Concentric Hexagon Monogram (Recedes into Soft Halo Backdrop on Hover) -->
                <div
                  class="relative w-[166px] h-[166px] flex items-center justify-center transition-all duration-500 ease-signal"
                  :class="activeMemberId === member.id ? 'opacity-25 scale-110' : 'opacity-100 scale-100'"
                >
                  <svg
                    width="166"
                    height="166"
                    viewBox="0 0 166 166"
                    fill="none"
                    class="w-full h-full overflow-visible"
                    aria-hidden="true"
                  >
                    <!-- Outer orbital concentric hexagon slowly rotating clockwise -->
                    <g class="team-hex-spin-cw" :style="{ animationDelay: `${idx * -4}s` }">
                      <polygon
                        points="83,8 148,45.5 148,120.5 83,158 18,120.5 18,45.5"
                        fill="none"
                        :stroke="themeMap[member.theme].primary"
                        stroke-opacity="0.22"
                        stroke-width="1"
                      />
                      <polygon
                        points="83,15 142,49 142,117 83,151 24,117 24,49"
                        fill="none"
                        :stroke="themeMap[member.theme].light"
                        stroke-opacity="0.16"
                        stroke-width="0.85"
                        stroke-dasharray="3 7"
                      />
                    </g>

                    <!-- Mid concentric hexagon counter-rotating with glowing orbital vertex beads -->
                    <g class="team-hex-spin-ccw" :style="{ animationDelay: `${idx * -3}s` }">
                      <polygon
                        points="83,27 131.5,55 131.5,111 83,139 34.5,111 34.5,55"
                        fill="none"
                        :stroke="themeMap[member.theme].primary"
                        stroke-opacity="0.46"
                        stroke-width="1.15"
                      />
                      <circle cx="83" cy="27" r="2.2" :fill="themeMap[member.theme].light" fill-opacity="0.9" />
                      <circle cx="131.5" cy="111" r="1.8" :fill="themeMap[member.theme].primary" fill-opacity="0.85" />
                      <circle cx="34.5" cy="111" r="1.8" :fill="themeMap[member.theme].light" fill-opacity="0.75" />
                    </g>

                    <!-- Expanding luminous radar pulse echo radiating from core monogram -->
                    <polygon
                      points="83,49 112.5,66 112.5,100 83,117 53.5,100 53.5,66"
                      fill="none"
                      :stroke="themeMap[member.theme].light"
                      stroke-width="1.2"
                      class="team-hex-ripple"
                      :style="{ animationDelay: `${idx * 0.7}s` }"
                    />

                    <!-- Upright inner luminous monogram hexagon with calm breathing glow -->
                    <polygon
                      points="83,49 112.5,66 112.5,100 83,117 53.5,100 53.5,66"
                      fill="#121822"
                      fill-opacity="0.94"
                      :stroke="themeMap[member.theme].light"
                      stroke-width="1.9"
                      stroke-linejoin="round"
                      class="team-hex-breathe"
                      :style="{
                        animationDelay: `${idx * 0.65}s`,
                        filter: `drop-shadow(0 0 10px ${themeMap[member.theme].glow})`,
                      }"
                    />
                  </svg>

                  <span
                    class="absolute font-display font-bold text-[20px] tracking-[0.06em] text-ink-primary transition-opacity duration-300"
                    :class="activeMemberId === member.id ? 'opacity-0' : 'opacity-100'"
                  >
                    {{ member.initials }}
                  </span>
                </div>

                <!-- 3D Pop-Out Dual-Pose Transparent Portrait (Extends ~58px ABOVE Card Top Outline on Hover!) -->
                <div
                  class="pointer-events-none absolute inset-x-0 -top-[58px] bottom-0 z-20 flex items-end justify-center transition-all duration-500 ease-grand"
                  :class="
                    activeMemberId === member.id
                      ? 'opacity-100 translate-y-0 scale-100'
                      : 'opacity-0 translate-y-7 scale-[0.88]'
                  "
                >
                  <div
                    class="relative w-[246px] h-[262px]"
                    :style="{ filter: themeMap[member.theme].dropShadow }"
                  >
                    <img
                      :src="member.poses[0]"
                      :alt="`${member.name} portrait pose 1`"
                      width="640"
                      height="640"
                      decoding="async"
                      class="absolute inset-0 w-full h-full object-contain object-bottom transition-all duration-500 ease-signal will-change-[opacity,transform]"
                      :class="
                        activeMemberId === member.id && poseIndex === 0
                          ? 'opacity-100 scale-100 translate-y-0'
                          : 'opacity-0 scale-[0.96] translate-y-1.5'
                      "
                    >
                    <img
                      :src="member.poses[1]"
                      :alt="`${member.name} portrait pose 2`"
                      width="640"
                      height="640"
                      decoding="async"
                      class="absolute inset-0 w-full h-full object-contain object-bottom transition-all duration-500 ease-signal will-change-[opacity,transform]"
                      :class="
                        activeMemberId === member.id && poseIndex === 1
                          ? 'opacity-100 scale-100 translate-y-0'
                          : 'opacity-0 scale-[0.96] translate-y-1.5'
                      "
                    >
                  </div>
                </div>

                <!-- Tiny 2-Pose Active Indicator Dots (Bottom-Right of Stage While Hovered) -->
                <div
                  class="pointer-events-none absolute bottom-2 right-4 z-30 flex items-center gap-1.5 transition-opacity duration-300"
                  :class="activeMemberId === member.id ? 'opacity-100' : 'opacity-0'"
                  aria-hidden="true"
                >
                  <span
                    class="w-1.5 h-1.5 rounded-full transition-all duration-300"
                    :style="{
                      backgroundColor: poseIndex === 0 ? themeMap[member.theme].light : 'rgba(148, 163, 184, 0.35)',
                      transform: poseIndex === 0 ? 'scale(1.25)' : 'scale(1)',
                    }"
                  />
                  <span
                    class="w-1.5 h-1.5 rounded-full transition-all duration-300"
                    :style="{
                      backgroundColor: poseIndex === 1 ? themeMap[member.theme].light : 'rgba(148, 163, 184, 0.35)',
                      transform: poseIndex === 1 ? 'scale(1.25)' : 'scale(1)',
                    }"
                  />
                </div>
              </div>

              <!-- Bottom Left-Aligned Member Details -->
              <div class="relative z-20 px-6 pb-6 pt-2 flex-1 flex flex-col">
                <p
                  class="font-mono text-[10px] font-bold uppercase tracking-[0.14em]"
                  :style="{ color: themeMap[member.theme].light }"
                >
                  {{ member.roleTag }}
                </p>

                <h3 class="mt-2 font-editorial font-semibold text-ink-primary text-[19px] sm:text-[20px] leading-snug">
                  {{ member.name }}
                </h3>

                <p class="mt-1 font-sans text-[12px] text-ink-muted">
                  {{ member.affiliation }}
                </p>

                <p class="mt-3.5 font-sans text-[13px] leading-[1.64] text-ink-secondary">
                  {{ member.bio }}
                </p>
              </div>
            </div>
          </article>
        </div>
      </div>

      <!-- Animated Scroll Cue Beneath "The team behind..." (Fades Out Smoothly Before Demand Route Begins) -->
      <div
        class="mt-16 sm:mt-20 flex flex-col items-center justify-center gap-3 select-none will-change-[opacity,transform]"
        :style="scrollCueStyle"
      >
        <span class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0E141D]/90 border border-mint/25 font-mono text-[10px] uppercase tracking-[0.2em] text-mint shadow-[0_0_24px_rgba(16,185,129,0.16)]">
          <span class="w-1.5 h-1.5 rounded-full bg-mint open-sign-glow" aria-hidden="true" />
          <span>SCROLL</span>
        </span>

        <div class="relative flex flex-col items-center">
          <div class="w-px h-10 bg-gradient-to-b from-mint/80 via-mint/35 to-transparent overflow-hidden relative">
            <span class="team-scroll-drop absolute top-0 left-1/2 -translate-x-1/2 w-[3px] h-3 rounded-full bg-[#00E5A8] shadow-[0_0_10px_#00E5A8]" />
          </div>
          <ChevronDown class="w-4 h-4 -mt-1.5 text-mint/80 team-scroll-chevron" :stroke-width="2" />
        </div>
      </div>
    </div>

    <!-- Deep Bottom Obsidian Fade Veil Leading Seamlessly Into Act 1 Demand Route -->
    <div
      class="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-b from-transparent to-[#090D12]"
      aria-hidden="true"
    />
  </section>
</template>

<style scoped>
.team-scroll-drop {
  animation: team-drop-travel 1.9s cubic-bezier(0.22, 1, 0.36, 1) infinite;
}

.team-scroll-chevron {
  animation: team-chevron-bob 1.9s ease-in-out infinite;
}

@keyframes team-drop-travel {
  0% {
    transform: translate(-50%, -100%);
    opacity: 0;
  }
  25% {
    opacity: 1;
  }
  85% {
    opacity: 0.9;
  }
  100% {
    transform: translate(-50%, 340%);
    opacity: 0;
  }
}

@keyframes team-chevron-bob {
  0%,
  100% {
    transform: translateY(0);
    opacity: 0.55;
  }
  50% {
    transform: translateY(4px);
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .team-scroll-drop,
  .team-scroll-chevron {
    animation: none;
  }
}
</style>
