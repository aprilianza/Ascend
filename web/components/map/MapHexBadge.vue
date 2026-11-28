<script setup lang="ts">
import type { AreaLabel } from '~/types/areas'

const props = withDefaults(
  defineProps<{
    label: AreaLabel
    size?: 'sm' | 'lg'
  }>(),
  {
    size: 'lg',
  },
)

const uid = useId()
const patternId = computed(() => `hex-pat-${props.label}-${uid}`)
const pxSize = computed(() => (props.size === 'sm' ? 36 : 48))

const strokeMap: Record<AreaLabel, string> = {
  opportunity: '#34D399',
  fair: '#FBBF24',
  crowded: '#F87171',
  not_enough_demand: '#94A3B8',
}
</script>

<template>
  <svg
    :width="pxSize"
    :height="pxSize"
    viewBox="0 0 48 48"
    fill="none"
    class="shrink-0"
    aria-hidden="true"
  >
    <defs>
      <!-- Opportunity: Emerald + Diagonal Forward Hatch -->
      <pattern
        v-if="label === 'opportunity'"
        :id="patternId"
        width="7"
        height="7"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <rect width="7" height="7" fill="#10B981" />
        <line x1="0" y1="0" x2="0" y2="7" stroke="#064E3B" stroke-width="2" stroke-opacity="0.45" />
      </pattern>

      <!-- Fair: Warm Amber + Horizontal Lines -->
      <pattern
        v-else-if="label === 'fair'"
        :id="patternId"
        width="8"
        height="6"
        patternUnits="userSpaceOnUse"
      >
        <rect width="8" height="6" fill="#E5940A" />
        <line x1="0" y1="3" x2="8" y2="3" stroke="#78350F" stroke-width="1.6" stroke-opacity="0.42" />
      </pattern>

      <!-- Crowded: Coral Red + Cross Hatch -->
      <pattern
        v-else-if="label === 'crowded'"
        :id="patternId"
        width="7"
        height="7"
        patternUnits="userSpaceOnUse"
        patternTransform="rotate(45)"
      >
        <rect width="7" height="7" fill="#D93D3D" />
        <line x1="0" y1="0" x2="0" y2="7" stroke="#450A0A" stroke-width="1.6" stroke-opacity="0.45" />
        <line x1="0" y1="0" x2="7" y2="0" stroke="#450A0A" stroke-width="1.6" stroke-opacity="0.45" />
      </pattern>

      <!-- Not enough demand: Cool Slate + Dotted Stipple -->
      <pattern
        v-else
        :id="patternId"
        width="6"
        height="6"
        patternUnits="userSpaceOnUse"
      >
        <rect width="6" height="6" fill="#526073" />
        <circle cx="2" cy="2" r="1.05" fill="#E2E8F0" fill-opacity="0.48" />
        <circle cx="5" cy="5" r="1.05" fill="#E2E8F0" fill-opacity="0.48" />
      </pattern>
    </defs>

    <!-- Pointy-Top Hexagon -->
    <polygon
      points="24,2.5 42.5,13.2 42.5,34.8 24,45.5 5.5,34.8 5.5,13.2"
      :fill="`url(#${patternId})`"
      :stroke="strokeMap[label]"
      stroke-width="1.4"
      stroke-linejoin="round"
    />

    <!-- Semantic Center Glyph (Colorblind-Safe Shape Cue) -->
    <g v-if="label === 'opportunity'" stroke="#061D15" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">
      <path d="M18 23.5 L24 18 L30 23.5" />
      <path d="M18 29 L24 23.5 L30 29" />
    </g>
    <g v-else-if="label === 'fair'" stroke="#1C1102" stroke-width="2.3" stroke-linecap="round">
      <line x1="17.5" y1="21" x2="30.5" y2="21" />
      <line x1="17.5" y1="27" x2="30.5" y2="27" />
    </g>
    <g v-else-if="label === 'crowded'" fill="none" stroke="#FFF1F2" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round">
      <polygon points="24,15.5 31.5,20 24,24.5 16.5,20" fill="#FFF1F2" fill-opacity="0.9" />
      <path d="M16.5 24.5 L24 29 L31.5 24.5" />
      <path d="M16.5 29 L24 33.5 L31.5 29" />
    </g>
    <g v-else stroke="#E2E8F0" stroke-width="2.2" stroke-linecap="round">
      <line x1="18.5" y1="24" x2="29.5" y2="24" />
    </g>
  </svg>
</template>
