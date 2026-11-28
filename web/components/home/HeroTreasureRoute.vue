<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    energized?: boolean
    cycleKey?: number
    cyclePhase?: 'enter' | 'exit'
  }>(),
  {
    energized: false,
    cycleKey: 0,
    cyclePhase: 'enter',
  },
)

const emit = defineEmits<{
  replay: []
}>()

const xHovered = ref(false)

function handleReplay() {
  emit('replay')
}

// Primary treasure-hunt SVG path starting cleanly under A, curving through 3 kawung-hex waypoints
// strictly below ASCEND at all screen sizes, and aiming straight into the warm amber X target
const TRAIL_PATH = 'M 14 78 C 122 80, 214 75, 318 88 C 402 96, 464 62, 538 59 C 594 56, 628 52, 666 44 L 724 86 L 784 54 Q 842 46, 898 41'

const WAYPOINTS = [
  { id: 'wp-1', x: 318, y: 88, delay: '0.86s', exitDelay: '0.28s' },
  { id: 'wp-2', x: 666, y: 44, delay: '1.56s', exitDelay: '0.68s' },
  { id: 'wp-3', x: 724, y: 86, delay: '1.78s', exitDelay: '0.84s' },
] as const
</script>

<template>
  <div class="relative w-full mt-2 sm:mt-3 px-0.5">
    <svg
      :key="props.cycleKey"
      viewBox="0 0 980 116"
      class="w-full h-auto overflow-visible"
      :class="props.cyclePhase === 'exit' ? 'treasure-phase-exit' : 'treasure-phase-enter'"
      fill="none"
      role="img"
      aria-label="Animated treasure-hunt route leading from ASCEND toward the opportunity X mark"
    >
      <defs>
        <linearGradient id="treasure-trail-grad" x1="0%" y1="50%" x2="100%" y2="30%">
          <stop offset="0%" stop-color="#14B8A6" stop-opacity="0.72" />
          <stop offset="45%" stop-color="#10B981" />
          <stop offset="82%" stop-color="#00E5A8" />
          <stop offset="100%" stop-color="#FBBF24" />
        </linearGradient>

        <linearGradient id="treasure-x-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FEF08A" />
          <stop offset="50%" stop-color="#F59E0B" />
          <stop offset="100%" stop-color="#D97706" />
        </linearGradient>

        <filter id="treasure-mint-glow" x="-40%" y="-80%" width="180%" height="260%">
          <feGaussianBlur stdDeviation="3.4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="treasure-amber-glow" x="-90%" y="-90%" width="280%" height="280%">
          <feGaussianBlur stdDeviation="5.5" result="blur1" />
          <feGaussianBlur stdDeviation="2" result="blur2" />
          <feMerge>
            <feMergeNode in="blur1" />
            <feMergeNode in="blur2" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <!-- Progressive left-to-right draw-in & draw-out reveal mask -->
        <mask :id="`treasure-draw-mask-${props.cycleKey}`" maskUnits="userSpaceOnUse" x="-10" y="-10" width="1000" height="140">
          <path
            :d="TRAIL_PATH"
            pathLength="1000"
            stroke="white"
            stroke-width="24"
            stroke-linecap="round"
            stroke-linejoin="round"
            :class="props.cyclePhase === 'exit' ? 'treasure-mask-exit' : 'treasure-mask-reveal'"
          />
        </mask>
      </defs>

      <!-- Hidden motion geometry reference -->
      <path :id="`ascend-treasure-path-${props.cycleKey}`" :d="TRAIL_PATH" stroke="none" fill="none" />

      <!-- Soft ambient under-glow tracing the revealed route -->
      <path
        :d="TRAIL_PATH"
        stroke="url(#treasure-trail-grad)"
        :stroke-width="props.energized || xHovered ? '6.5' : '4.5'"
        stroke-opacity="0.22"
        stroke-linecap="round"
        stroke-linejoin="round"
        :mask="`url(#treasure-draw-mask-${props.cycleKey})`"
        filter="url(#treasure-mint-glow)"
        class="transition-all duration-300"
      />

      <!-- Main Treasure-Map Dashed Route (draws in left->right, marches, then sweeps out left->right every 15s!) -->
      <path
        :d="TRAIL_PATH"
        stroke="url(#treasure-trail-grad)"
        :stroke-width="props.energized || xHovered ? '3.4' : '2.7'"
        stroke-dasharray="11 9"
        stroke-linecap="round"
        stroke-linejoin="round"
        :mask="`url(#treasure-draw-mask-${props.cycleKey})`"
        filter="url(#treasure-mint-glow)"
        class="treasure-dash-march transition-all duration-300"
      />

      <!-- Arrowhead pointing right into the Amber X target -->
      <path
        d="M 888 34 L 903 40.5 L 890 50"
        stroke="#00E5A8"
        stroke-width="2.7"
        stroke-linecap="round"
        stroke-linejoin="round"
        filter="url(#treasure-mint-glow)"
        :class="props.cyclePhase === 'exit' ? 'treasure-arrow-exit' : 'treasure-arrow-pop'"
      />

      <!-- Leading Explorer Comet (Initial Draw Journey from A -> X synchronized with ASCEND letters!) -->
      <g v-if="props.cyclePhase === 'enter'" class="treasure-comet-initial">
        <circle r="8.5" fill="rgba(0, 229, 168, 0.34)" filter="url(#treasure-mint-glow)">
          <animateMotion
            dur="2.1s"
            begin="0.25s"
            fill="freeze"
            keyTimes="0;1"
            keySplines="0.22 0.85 0.28 1"
            calcMode="spline"
          >
            <mpath :href="`#ascend-treasure-path-${props.cycleKey}`" />
          </animateMotion>
        </circle>
        <circle r="3.4" fill="#FEF08A">
          <animateMotion
            dur="2.1s"
            begin="0.25s"
            fill="freeze"
            keyTimes="0;1"
            keySplines="0.22 0.85 0.28 1"
            calcMode="spline"
          >
            <mpath :href="`#ascend-treasure-path-${props.cycleKey}`" />
          </animateMotion>
        </circle>
      </g>

      <!-- Continuous Living Scout Pulse (Active during hold phase) -->
      <g v-if="props.cyclePhase === 'enter'" class="treasure-comet-loop">
        <circle r="5.5" fill="rgba(251, 191, 36, 0.36)" filter="url(#treasure-mint-glow)">
          <animateMotion
            :dur="props.energized || xHovered ? '1.8s' : '3.6s'"
            begin="2.8s"
            repeatCount="indefinite"
          >
            <mpath :href="`#ascend-treasure-path-${props.cycleKey}`" />
          </animateMotion>
        </circle>
        <circle r="2.6" fill="#ECFDF5">
          <animateMotion
            :dur="props.energized || xHovered ? '1.8s' : '3.6s'"
            begin="2.8s"
            repeatCount="indefinite"
          >
            <mpath :href="`#ascend-treasure-path-${props.cycleKey}`" />
          </animateMotion>
        </circle>
      </g>

      <!-- 3 Nusantara Kawung-Hex Waypoint Nodes along the route -->
      <g
        v-for="wp in WAYPOINTS"
        :key="wp.id"
        :transform="`translate(${wp.x}, ${wp.y})`"
      >
        <circle
          v-if="props.cyclePhase === 'enter'"
          cx="0"
          cy="0"
          r="11"
          stroke="#00E5A8"
          stroke-width="1.3"
          class="treasure-waypoint-ring"
          :style="{ '--wp-delay': wp.delay }"
        />
        <g
          :class="props.cyclePhase === 'exit' ? 'treasure-waypoint-exit' : 'treasure-waypoint-node'"
          :style="{
            '--wp-delay': wp.delay,
            '--wp-exit-delay': wp.exitDelay,
          }"
        >
          <polygon
            points="0,-9.5 8.2,-4.75 8.2,4.75 0,9.5 -8.2,4.75 -8.2,-4.75"
            fill="#071814"
            stroke="#00E5A8"
            stroke-width="1.4"
            filter="url(#treasure-mint-glow)"
          />
          <circle cx="0" cy="-3.2" r="1.4" fill="#34D399" />
          <circle cx="0" cy="3.2" r="1.4" fill="#34D399" />
          <circle cx="-3.2" cy="0" r="1.4" fill="#34D399" />
          <circle cx="3.2" cy="0" r="1.4" fill="#34D399" />
        </g>
      </g>

      <!-- RADIANT WARM AMBER (X) TREASURE TARGET (Click to replay synchronized 15s cycle!) -->
      <g
        transform="translate(938, 40)"
        class="pointer-events-auto cursor-pointer outline-none"
        role="button"
        tabindex="0"
        aria-label="Replay treasure route animation"
        @mouseenter="xHovered = true"
        @mouseleave="xHovered = false"
        @click="handleReplay"
        @keydown.enter.prevent="handleReplay"
        @keydown.space.prevent="handleReplay"
      >
        <circle cx="0" cy="0" r="30" fill="transparent" />

        <circle
          v-if="props.cyclePhase === 'enter'"
          cx="0"
          cy="0"
          r="18"
          stroke="#FBBF24"
          stroke-width="1.6"
          class="treasure-x-shockwave"
        />
        <circle
          cx="0"
          cy="0"
          r="24"
          stroke="#F59E0B"
          stroke-width="1"
          stroke-dasharray="4 6"
          class="transition-all duration-300"
          :class="
            props.cyclePhase === 'exit'
              ? 'opacity-0'
              : xHovered || props.energized
                ? 'opacity-85 hero-astrolabe-cw'
                : 'opacity-25'
          "
          style="transform-box: fill-box; transform-origin: center;"
        />

        <circle
          cx="0"
          cy="0"
          r="22"
          fill="rgba(245, 158, 11, 0.22)"
          filter="url(#treasure-amber-glow)"
          :class="props.cyclePhase === 'exit' ? 'treasure-x-exit' : 'treasure-x-ignite'"
        />

        <g
          v-if="props.cyclePhase === 'enter'"
          class="treasure-x-sparks"
          stroke="#FEF08A"
          stroke-width="1.5"
          stroke-linecap="round"
        >
          <line x1="0" y1="-22" x2="0" y2="-28" />
          <line x1="0" y1="22" x2="0" y2="28" />
          <line x1="-22" y1="0" x2="-28" y2="0" />
          <line x1="22" y1="0" x2="28" y2="0" />
        </g>

        <g :class="props.cyclePhase === 'exit' ? 'treasure-x-exit' : 'treasure-x-ignite'" filter="url(#treasure-amber-glow)">
          <g
            class="transition-transform duration-300"
            :style="{
              transformBox: 'fill-box',
              transformOrigin: 'center',
              transform: xHovered ? 'scale(1.14) rotate(6deg)' : 'scale(1)',
            }"
          >
            <path
              d="M -13 -13 L 13 13 M 13 -13 L -13 13"
              stroke="url(#treasure-x-grad)"
              stroke-width="5.6"
              stroke-linecap="round"
            />
            <path
              d="M -12 -12 L 12 12 M 12 -12 L -12 12"
              stroke="#FEF9C3"
              stroke-opacity="0.72"
              stroke-width="1.6"
              stroke-linecap="round"
            />
          </g>
        </g>

        <text
          x="0"
          y="36"
          text-anchor="middle"
          class="font-mono text-[9px] uppercase tracking-[0.14em] fill-[#FBBF24] transition-opacity duration-200 select-none"
          :class="xHovered && props.cyclePhase === 'enter' ? 'opacity-95' : 'opacity-0'"
        >
          REPLAY
        </text>
      </g>
    </svg>
  </div>
</template>
