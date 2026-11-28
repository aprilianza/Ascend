<script setup lang="ts">
import { ArrowDown } from 'lucide-vue-next'
const settings = useAscendSettings()
const HOME_COPY = computed(() => settings.homeCopy.value)

const dotGrid = computed(() => {
  const dots: Array<{ x: number; y: number; opacity: number; mint: boolean; teal: boolean }> = []
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 9; col++) {
      const dist = (col * 0.55 + row * 0.45) / 7.5
      const opacity = Math.max(0.14, 0.72 - dist * 0.52)
      const mint = (col === 2 && row === 1) || (col === 5 && row === 3) || (col === 7 && row === 1)
      const teal = (col === 1 && row === 3) || (col === 4 && row === 1)
      dots.push({
        x: 68 + col * 32,
        y: 34 + row * 30,
        opacity,
        mint,
        teal,
      })
    }
  }
  return dots
})
</script>

<template>
  <section id="masalah" class="relative z-20 pt-10 pb-24 bg-ground bg-signal-dots overflow-x-clip">
    <!-- Minimalist Nusantara Primary-Mint Section Divider -->
    <div class="mx-auto max-w-frame px-8 mb-16" aria-hidden="true">
      <div class="w-full flex items-center justify-center gap-3">
        <div
          class="h-px flex-1"
          style="background: linear-gradient(90deg, transparent 0%, rgba(16, 185, 129, 0.28) 24%, rgba(16, 185, 129, 0.72) 100%);"
        />
        <svg width="78" height="22" viewBox="0 0 78 22" fill="none" class="shrink-0">
          <!-- Left tiny wajik (tenun diamond) -->
          <polygon points="10,11 13.2,7.8 16.4,11 13.2,14.2" fill="#10B981" fill-opacity="0.88" />
          <!-- Centered minimalist Nusantara Kawung frame -->
          <rect
            x="27"
            y="2.5"
            width="24"
            height="17"
            rx="5"
            fill="#0D1916"
            stroke="#10B981"
            stroke-width="1.15"
            stroke-opacity="0.85"
          />
          <!-- Four delicate Kawung petals inside the frame -->
          <ellipse cx="36.2" cy="8.4" rx="2.3" ry="1.5" transform="rotate(-32 36.2 8.4)" stroke="#34D399" stroke-width="0.9" stroke-opacity="0.78" />
          <ellipse cx="41.8" cy="8.4" rx="2.3" ry="1.5" transform="rotate(32 41.8 8.4)" stroke="#34D399" stroke-width="0.9" stroke-opacity="0.78" />
          <ellipse cx="36.2" cy="13.6" rx="2.3" ry="1.5" transform="rotate(32 36.2 13.6)" stroke="#34D399" stroke-width="0.9" stroke-opacity="0.78" />
          <ellipse cx="41.8" cy="13.6" rx="2.3" ry="1.5" transform="rotate(-32 41.8 13.6)" stroke="#34D399" stroke-width="0.9" stroke-opacity="0.78" />
          <circle cx="39" cy="11" r="1.5" fill="#00E5A8" />
          <!-- Right tiny wajik (tenun diamond) -->
          <polygon points="61.6,11 64.8,7.8 68,11 64.8,14.2" fill="#10B981" fill-opacity="0.88" />
        </svg>
        <div
          class="h-px flex-1"
          style="background: linear-gradient(90deg, rgba(16, 185, 129, 0.72) 0%, rgba(16, 185, 129, 0.28) 76%, transparent 100%);"
        />
      </div>
    </div>

    <div class="mx-auto max-w-frame px-8">
      <!-- Section Heading (Josefin Sans 600, 40/46, "eye" mint italic) -->
      <div class="max-w-2xl mb-14">
        <p
          v-reveal="{ variant: 'up' }"
          class="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-mint mb-3"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-mint shadow-[0_0_8px_rgba(16,185,129,0.85)]" aria-hidden="true" />
          <span>{{ HOME_COPY.blindspots.eyebrow }}</span>
        </p>
        <h2 v-reveal="{ variant: 'up', delay: 80 }" class="font-editorial font-semibold text-ink-primary text-[42px] leading-[1.15] tracking-[-0.01em]">
          {{ HOME_COPY.blindspots.headlinePrefix }}
          <span class="editorial-mint">{{ HOME_COPY.blindspots.headlineAccent }}</span>
          {{ HOME_COPY.blindspots.headlineSuffix }}
        </h2>
      </div>

      <!-- Three asymmetric chamfered cards with uncropped hover lift, primary-mint highlight, sheen sweep, and animated illustrations -->
      <div class="flex flex-col gap-7">
        <div
          v-for="(item, idx) in HOME_COPY.blindspots.items"
          :key="item.index"
          v-reveal="{ variant: idx === 1 ? 'right' : 'left', delay: idx * 90 }"
          class="relative"
        >
          <article
            class="blindspot-card group relative z-10"
            :class="idx === 1 ? 'ml-14' : 'mr-14'"
          >
            <div class="blindspot-card-inner p-10 min-h-[308px] grid grid-cols-12 gap-10 items-center">
            <!-- Emerald depth wash on hover -->
            <div class="blindspot-card-glow-layer" aria-hidden="true" />

            <!-- Diagonal "kinclong" glass shimmer sweep on hover -->
            <div class="blindspot-sheen" aria-hidden="true" />

            <!-- Subtle 4-point star sparkles ("kinclong-kinclong") twinkling when hovered -->
            <svg
              class="blindspot-sparkle blindspot-sparkle-a absolute top-4 right-7 w-4 h-4 z-20"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path d="M10 1L11.8 8.2L19 10L11.8 11.8L10 19L8.2 11.8L1 10L8.2 8.2L10 1Z" fill="#ECFDF5" />
            </svg>
            <svg
              class="blindspot-sparkle blindspot-sparkle-b absolute bottom-5 right-16 w-3 h-3 z-20"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path d="M10 1L11.8 8.2L19 10L11.8 11.8L10 19L8.2 11.8L1 10L8.2 8.2L10 1Z" fill="#D1FAE5" />
            </svg>
            <svg
              class="blindspot-sparkle blindspot-sparkle-c absolute top-8 left-1/2 w-2.5 h-2.5 z-20"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path d="M10 1L11.8 8.2L19 10L11.8 11.8L10 19L8.2 11.8L1 10L8.2 8.2L10 1Z" fill="#FFFFFF" />
            </svg>

            <!-- Visual Illustration Panel (Stays crisp dark obsidian so glowing animations pop against mint hover card) -->
            <div
              class="relative z-10 col-span-5 h-[228px] rounded-xl bg-[#0A0E14] border border-[#232836] overflow-hidden flex items-center justify-center p-4 transition-all duration-mid ease-signal group-hover:border-[#A7F3D0]/70 group-hover:shadow-[0_14px_32px_rgba(4,24,17,0.45)]"
              :class="idx === 1 ? 'order-2' : 'order-1'"
            >
              <!-- 01: Crowding you can't see (500 m radar scan revealing hidden rivals in neighboring lanes) -->
              <svg
                v-if="item.visualType === 'competition'"
                viewBox="0 0 360 210"
                class="w-full h-full"
                fill="none"
                role="img"
                aria-label="Animated hexagon map scanning nearby lanes to reveal hidden competing shops sharing the same buyers"
              >
                <!-- Subtle street arteries -->
                <path d="M 14 172 L 180 100 L 348 36" stroke="#1E2633" stroke-width="1.2" />
                <path d="M 38 22 L 180 100 L 326 178" stroke="#1E2633" stroke-width="1.2" />

                <!-- Soft expanding 500 m scan radar rings -->
                <circle cx="180" cy="100" r="68" stroke="#10B981" stroke-width="1" stroke-opacity="0.35" class="bs-radar-ring" />
                <circle cx="180" cy="100" r="68" stroke="#14B8A6" stroke-width="1" stroke-opacity="0.28" class="bs-radar-ring-delay" />

                <!-- Outer context dim hexagons -->
                <polygon points="244,54 268,68 268,96 244,110 220,96 220,68" fill="#121721" stroke="#222A38" stroke-width="1" />
                <polygon points="116,130 140,144 140,172 116,186 92,172 92,144" fill="#121721" stroke="#222A38" stroke-width="1" />

                <!-- Buyer-flow dashed paths splitting from center curb into hidden lane rivals -->
                <path d="M 180 100 L 134 74" stroke="#EF4444" stroke-width="1.35" stroke-opacity="0.72" class="bs-dash-flow" />
                <path d="M 180 100 L 226 126" stroke="#F59E0B" stroke-width="1.35" stroke-opacity="0.72" class="bs-dash-flow" />
                <path d="M 180 100 L 180 46" stroke="#EF4444" stroke-width="1.35" stroke-opacity="0.72" class="bs-dash-flow" />

                <!-- Center focal spot ("Open curb") -->
                <polygon
                  points="180,72 204,86 204,114 180,128 156,114 156,86"
                  fill="#10B981"
                  fill-opacity="0.22"
                  stroke="#34D399"
                  stroke-width="1.6"
                />
                <g transform="translate(170, 90)">
                  <path
                    d="M2.5 8L3.8 4H16.2L17.5 8M3.5 8V15H16.5V8M8 15V11H12V15"
                    stroke="#ECFDF5"
                    stroke-width="1.45"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </g>

                <!-- Hidden Neighbor 1 (Top: "?" alternates with revealed Coral Red rival shop) -->
                <g transform="translate(180, 44)">
                  <polygon
                    points="0,-24 21,-12 21,12 0,24 -21,12 -21,-12"
                    fill="#181F2B"
                    stroke="#EF4444"
                    stroke-width="1.35"
                    stroke-dasharray="4 3"
                  />
                  <text y="6" text-anchor="middle" fill="#94A3B8" font-family="Space Mono, monospace" font-weight="700" font-size="14" class="bs-q-fade-1">?</text>
                  <g class="bs-rival-reveal-1">
                    <polygon points="0,-24 21,-12 21,12 0,24 -21,12 -21,-12" fill="#EF4444" fill-opacity="0.24" stroke="#EF4444" stroke-width="1.5" />
                    <path d="M-7 -2L-5.5 -6H5.5L7 -2M-6 -2V6H6V-2M-2 6V2H2V6" stroke="#FCA5A5" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
                  </g>
                </g>

                <!-- Hidden Neighbor 2 (Upper-Left: "?" alternates with revealed Coral Red rival shop) -->
                <g transform="translate(132, 72)">
                  <polygon
                    points="0,-24 21,-12 21,12 0,24 -21,12 -21,-12"
                    fill="#181F2B"
                    stroke="#EF4444"
                    stroke-width="1.35"
                    stroke-dasharray="4 3"
                  />
                  <text y="6" text-anchor="middle" fill="#94A3B8" font-family="Space Mono, monospace" font-weight="700" font-size="14" class="bs-q-fade-2">?</text>
                  <g class="bs-rival-reveal-2">
                    <polygon points="0,-24 21,-12 21,12 0,24 -21,12 -21,-12" fill="#EF4444" fill-opacity="0.24" stroke="#EF4444" stroke-width="1.5" />
                    <path d="M-7 -2L-5.5 -6H5.5L7 -2M-6 -2V6H6V-2M-2 6V2H2V6" stroke="#FCA5A5" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
                  </g>
                </g>

                <!-- Hidden Neighbor 3 (Lower-Right: "?" alternates with revealed Warm Amber rival shop) -->
                <g transform="translate(228, 128)">
                  <polygon
                    points="0,-24 21,-12 21,12 0,24 -21,12 -21,-12"
                    fill="#181F2B"
                    stroke="#F59E0B"
                    stroke-width="1.35"
                    stroke-dasharray="4 3"
                  />
                  <text y="6" text-anchor="middle" fill="#94A3B8" font-family="Space Mono, monospace" font-weight="700" font-size="14" class="bs-q-fade-3">?</text>
                  <g class="bs-rival-reveal-3">
                    <polygon points="0,-24 21,-12 21,12 0,24 -21,12 -21,-12" fill="#F59E0B" fill-opacity="0.24" stroke="#F59E0B" stroke-width="1.5" />
                    <path d="M-7 -2L-5.5 -6H5.5L7 -2M-6 -2V6H6V-2M-2 6V2H2V6" stroke="#FDE68A" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" />
                  </g>
                </g>

                <!-- Bottom micro legend -->
                <text x="180" y="199" text-anchor="middle" fill="#64748B" font-family="Space Mono, monospace" font-size="8.5" letter-spacing="1.3">
                  OPEN CURB · HIDDEN LANE RIVALS (~500 M)
                </text>
              </svg>

              <!-- 02: Demand that doesn't show (Passing street traffic vs inner neighborhood walking hubs) -->
              <svg
                v-else-if="item.visualType === 'demand'"
                viewBox="0 0 360 210"
                class="w-full h-full"
                fill="none"
                role="img"
                aria-label="Animated neighborhood diagram comparing fast passing road traffic against steady inner-block walking demand from campus, office, and transit hubs"
              >
                <defs>
                  <clipPath id="road-lane-clip">
                    <rect x="14" y="16" width="24" height="162" rx="6" />
                  </clipPath>
                </defs>

                <!-- Left Street Edge: Passing Vehicles Gliding Past -->
                <rect x="14" y="16" width="24" height="162" rx="6" fill="#131922" stroke="#253041" stroke-width="1" />
                <line x1="26" y1="22" x2="26" y2="172" stroke="#2D3A4F" stroke-width="1" stroke-dasharray="4 5" />
                <g clip-path="url(#road-lane-clip)">
                  <rect x="18.5" y="16" width="3.5" height="18" rx="1.75" fill="#94A3B8" fill-opacity="0.65" class="bs-traffic-down" />
                  <rect x="18.5" y="16" width="3.5" height="14" rx="1.75" fill="#64748B" fill-opacity="0.6" class="bs-traffic-down-delay" />
                  <rect x="29.5" y="16" width="3.5" height="16" rx="1.75" fill="#F59E0B" fill-opacity="0.55" class="bs-traffic-up" />
                </g>
                <line x1="48" y1="16" x2="48" y2="178" stroke="#14B8A6" stroke-width="1.2" stroke-opacity="0.45" />

                <!-- Inner Neighborhood Subtle Grid -->
                <line v-for="r in 5" :key="`row-${r}`" x1="58" :y1="4 + r * 30" x2="338" :y2="4 + r * 30" stroke="#1B2330" stroke-width="0.75" stroke-dasharray="2 4" />
                <g v-for="(d, di) in dotGrid" :key="`dot-${di}`">
                  <circle
                    :cx="d.x"
                    :cy="d.y"
                    :r="d.mint || d.teal ? 2.6 : 1.7"
                    :fill="d.teal ? '#14B8A6' : d.mint ? '#10B981' : '#64748B'"
                    :fill-opacity="d.opacity * 0.72"
                  />
                </g>

                <!-- Calm Dotted Walking-Reach Footfall Streams Flowing to Center Target -->
                <path d="M 122 52 Q 162 72 198 96" stroke="#10B981" stroke-width="1.4" stroke-opacity="0.82" class="bs-dash-flow-slow" />
                <path d="M 294 56 Q 254 78 214 96" stroke="#14B8A6" stroke-width="1.4" stroke-opacity="0.82" class="bs-dash-flow-slow" />
                <path d="M 284 148 Q 246 130 214 108" stroke="#34D399" stroke-width="1.4" stroke-opacity="0.82" class="bs-dash-flow-slow" />

                <!-- Central Walking-Reach Destination Node (5 MIN WALK) -->
                <g transform="translate(204, 102)">
                  <circle r="24" fill="#10B981" fill-opacity="0.1" stroke="#10B981" stroke-width="1.1" stroke-dasharray="3 3" />
                  <polygon points="0,-13 11.2,-6.5 11.2,6.5 0,13 -11.2,6.5 -11.2,-6.5" fill="#10B981" fill-opacity="0.28" stroke="#34D399" stroke-width="1.4" />
                  <circle r="3.2" fill="#ECFDF5" />
                </g>

                <!-- Inner Hub 1: CAMPUS -->
                <g transform="translate(114, 48)">
                  <circle r="11" stroke="#10B981" stroke-width="1.1" class="bs-hub-ripple-1" />
                  <circle r="11" fill="#11221D" stroke="#10B981" stroke-width="1.35" />
                  <path d="M-5.5 -1L0 -4L5.5 -1L0 2L-5.5 -1ZM-3.5 1V4C-1.5 5 1.5 5 3.5 4V1" stroke="#34D399" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round" />
                  <text y="22" text-anchor="middle" fill="#94A3B8" font-family="Space Mono, monospace" font-size="7.5" letter-spacing="0.9">CAMPUS</text>
                </g>

                <!-- Inner Hub 2: OFFICE -->
                <g transform="translate(298, 52)">
                  <circle r="11" stroke="#14B8A6" stroke-width="1.1" class="bs-hub-ripple-2" />
                  <circle r="11" fill="#0F2124" stroke="#14B8A6" stroke-width="1.35" />
                  <rect x="-4.5" y="-5" width="9" height="10" rx="1" stroke="#5EEAD4" stroke-width="1.1" />
                  <path d="M-2 -2H-0.5M0.5 -2H2M-2 1H-0.5M0.5 1H2" stroke="#5EEAD4" stroke-width="1.1" stroke-linecap="round" />
                  <text y="22" text-anchor="middle" fill="#94A3B8" font-family="Space Mono, monospace" font-size="7.5" letter-spacing="0.9">OFFICE</text>
                </g>

                <!-- Inner Hub 3: TRANSIT -->
                <g transform="translate(288, 148)">
                  <circle r="11" stroke="#34D399" stroke-width="1.1" class="bs-hub-ripple-3" />
                  <circle r="11" fill="#11221D" stroke="#34D399" stroke-width="1.35" />
                  <rect x="-4.5" y="-5" width="9" height="8" rx="1.8" stroke="#6EE7B7" stroke-width="1.1" />
                  <line x1="-2.5" y1="5" x2="-4" y2="6.5" stroke="#6EE7B7" stroke-width="1.1" stroke-linecap="round" />
                  <line x1="2.5" y1="5" x2="4" y2="6.5" stroke="#6EE7B7" stroke-width="1.1" stroke-linecap="round" />
                  <text y="22" text-anchor="middle" fill="#94A3B8" font-family="Space Mono, monospace" font-size="7.5" letter-spacing="0.9">TRANSIT</text>
                </g>

                <text x="180" y="199" text-anchor="middle" fill="#64748B" font-family="Space Mono, monospace" font-size="8.5" letter-spacing="1.3">
                  PASSING ROAD · INNER WALKING DEMAND
                </text>
              </svg>

              <!-- 03: Rent comes before the answer (Day 0 Upfront Lease vs First Cup & Clarity) -->
              <svg
                v-else
                viewBox="0 0 360 210"
                class="w-full h-full"
                fill="none"
                role="img"
                aria-label="Animated timeline illustrating upfront lease payment before the first coffee cup is brewed and checking demand first"
              >
                <defs>
                  <linearGradient id="rent-contour-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="#F59E0B" />
                    <stop offset="48%" stop-color="#14B8A6" />
                    <stop offset="100%" stop-color="#10B981" />
                  </linearGradient>
                </defs>

                <!-- Background contour horizon lines -->
                <path d="M 18 172 Q 118 162 198 128 T 344 58" stroke="#1E2532" stroke-width="1" />
                <path d="M 18 184 Q 130 174 210 144 T 344 82" stroke="#1A202C" stroke-width="1" />

                <!-- Rising Clarity Trajectory + Marching Energy Dash -->
                <path
                  d="M 28 166 C 102 156, 168 134, 224 96 C 258 72, 290 58, 318 48"
                  stroke="url(#rent-contour-grad)"
                  stroke-width="2.2"
                  stroke-linecap="round"
                />
                <path
                  d="M 28 166 C 102 156, 168 134, 224 96 C 258 72, 290 58, 318 48"
                  stroke="#ECFDF5"
                  stroke-opacity="0.45"
                  stroke-width="1.3"
                  stroke-linecap="round"
                  class="bs-dash-flow-slow"
                />

                <!-- Day 0 Upfront Anchor Stem -->
                <line x1="114" y1="106" x2="114" y2="152" stroke="#F59E0B" stroke-width="1.15" stroke-dasharray="3 3" stroke-opacity="0.7" />
                <circle cx="114" cy="148" r="4.5" fill="#F59E0B" />
                <text x="114" y="168" text-anchor="middle" fill="#FBBF24" font-family="Space Mono, monospace" font-size="8" letter-spacing="0.8">
                  DAY 0 · LEASE
                </text>

                <!-- Floating Price Tag ("Rp/mo") -->
                <g transform="translate(36, 56)">
                  <g class="bs-float-tag">
                    <path
                      d="M 0 13 L 13 0 L 66 0 C 70 0 72 2 72 6 L 72 32 C 72 36 70 38 66 38 L 13 38 L 0 25 Z"
                      fill="#161C26"
                      stroke="#F8FAFC"
                      stroke-width="1.45"
                      stroke-linejoin="round"
                    />
                    <circle cx="16" cy="19" r="3.2" stroke="#F59E0B" stroke-width="1.4" />
                    <text x="45" y="23" text-anchor="middle" fill="#E2E8F0" font-family="Space Mono, monospace" font-weight="700" font-size="11">
                      Rp/mo
                    </text>
                  </g>
                </g>

                <!-- Floating Warm Amber Key -->
                <g transform="translate(122, 54)">
                  <g class="bs-float-key">
                    <circle cx="15" cy="18" r="10.5" fill="#161C26" stroke="#F59E0B" stroke-width="1.55" />
                    <circle cx="15" cy="18" r="3.8" stroke="#F59E0B" stroke-width="1.3" />
                    <path d="M 25.5 18 L 54 18 L 54 25 M 45 18 L 45 23.5" stroke="#F59E0B" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" />
                  </g>
                </g>

                <!-- Right Milestone: Steaming First Cup + Mint Clarity Check -->
                <g transform="translate(268, 42)">
                  <!-- Soft glowing halo -->
                  <circle cx="28" cy="28" r="26" fill="#10B981" fill-opacity="0.12" stroke="#10B981" stroke-opacity="0.45" stroke-width="1.15" />

                  <!-- Rising steam wisps -->
                  <path d="M 22 14 Q 20 9 23 5" stroke="#34D399" stroke-width="1.35" stroke-linecap="round" class="bs-steam-a" />
                  <path d="M 30 13 Q 33 8 30 4" stroke="#6EE7B7" stroke-width="1.35" stroke-linecap="round" class="bs-steam-b" />

                  <!-- Coffee cup silhouette -->
                  <path
                    d="M 16 20 H 36 V 33 C 36 37.5 32.5 40 26 40 C 19.5 40 16 37.5 16 33 V 20 Z"
                    fill="#10251F"
                    stroke="#34D399"
                    stroke-width="1.5"
                    stroke-linejoin="round"
                  />
                  <path d="M 36 23 H 40 C 42.5 23 43.5 25 43.5 27.5 C 43.5 30 42.5 32 40 32 H 36" stroke="#34D399" stroke-width="1.5" stroke-linecap="round" />

                  <!-- Mini emerald clarity check badge -->
                  <circle cx="46" cy="10" r="8" fill="#10B981" stroke="#0A0E14" stroke-width="1.5" />
                  <path d="M 42.5 10 L 45 12.5 L 49.5 7.8" stroke="#061812" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
                </g>

                <text x="296" y="114" text-anchor="middle" fill="#34D399" font-family="Space Mono, monospace" font-size="8" letter-spacing="0.8">
                  FIRST CUP
                </text>

                <line x1="22" y1="184" x2="338" y2="184" stroke="#1E2633" stroke-width="1" />
                <text x="180" y="199" text-anchor="middle" fill="#64748B" font-family="Space Mono, monospace" font-size="8.5" letter-spacing="1.3">
                  UPFRONT LEASE · CHECK DEMAND FIRST
                </text>
              </svg>
            </div>

            <!-- Copy Panel (Smoothly transitions typography to dark obsidian on primary-mint hover) -->
            <div
              class="relative z-10 col-span-7 flex flex-col justify-center"
              :class="idx === 1 ? 'order-1' : 'order-2'"
            >
              <span
                class="inline-flex w-fit items-center px-2.5 py-1 -ml-2.5 rounded-md border border-transparent font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-mint transition-all duration-300 group-hover:bg-[#051B14]/15 group-hover:border-[#051B14]/25 group-hover:text-[#041711]"
              >
                {{ item.eyebrow }}
              </span>
              <h3 class="mt-2.5 font-editorial font-semibold text-ink-primary text-[26px] sm:text-[32px] leading-[1.18] tracking-[-0.01em] transition-colors duration-300 group-hover:text-[#041510]">
                {{ item.title }}
              </h3>
              <p class="mt-3.5 font-sans text-[15.5px] sm:text-[16.5px] leading-[1.68] text-ink-secondary max-w-[540px] transition-colors duration-300 group-hover:text-[#08241B]">
                {{ item.description }}
              </p>
            </div>
          </div>
          </article>
        </div>
      </div>

      <!-- Centered SCROLL cue leading smoothly into the 3D Hexagon Portal -->
      <div class="mt-14 sm:mt-16 flex flex-col items-center">
        <a
          href="#counting-portal"
          class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#1B3538]/85 bg-[#081317]/80 hover:border-[#00E5A8]/70 font-mono text-[9.5px] uppercase tracking-[0.22em] text-[#8FA8AC] hover:text-[#00E5A8] transition-all duration-fast"
        >
          <span>{{ HOME_COPY.portal.scrollCue }}</span>
          <ArrowDown class="w-3.5 h-3.5 text-[#00E5A8] animate-bounce" :stroke-width="2" />
        </a>
      </div>
    </div>

    <!-- Soft bottom gradient feather melting cleanly into the dark portal abyss -->
    <div
      class="pointer-events-none absolute inset-x-0 bottom-0 h-24"
      style="background: linear-gradient(180deg, transparent 0%, #060A0F 100%);"
      aria-hidden="true"
    />
  </section>
</template>
