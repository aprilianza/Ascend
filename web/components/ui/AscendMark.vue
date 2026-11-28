<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: number
  }>(),
  {
    size: 28,
  },
)

const rawId = useId()
const uid = rawId.replace(/[^a-zA-Z0-9_-]/g, '')
const maskId = `ascend-pin-mask-${uid}`
const gradDarkId = `ascend-pin-grad-dark-${uid}`
const gradLightId = `ascend-pin-grad-light-${uid}`
const sheenId = `ascend-pin-sheen-${uid}`
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <defs>
      <!-- True transparent cutout for the centered rounded upward opportunity chevron -->
      <mask :id="maskId" maskUnits="userSpaceOnUse" x="0" y="0" width="32" height="32">
        <rect x="0" y="0" width="32" height="32" fill="white" />
        <path
          d="M 10.6 17.5 L 16 11.7 L 21.4 17.5"
          stroke="black"
          stroke-width="3.6"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </mask>

      <!-- Fresh Gen Z aurora mint-to-emerald gradient for dark surfaces -->
      <linearGradient :id="gradDarkId" x1="5" y1="2" x2="26" y2="30" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#34F5B5" />
        <stop offset="48%" stop-color="#10B981" />
        <stop offset="100%" stop-color="#0D9488" />
      </linearGradient>

      <!-- Deeper tactile emerald gradient for Map Light Mode navbar -->
      <linearGradient :id="gradLightId" x1="5" y1="2" x2="26" y2="30" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#10B981" />
        <stop offset="52%" stop-color="#059669" />
        <stop offset="100%" stop-color="#047857" />
      </linearGradient>

      <!-- Subtle top-crown glass rim highlight -->
      <linearGradient :id="sheenId" x1="16" y1="2" x2="16" y2="15" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.38" />
        <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0" />
      </linearGradient>
    </defs>

    <!-- Tactile Gen Z rounded Hex-Pin Beacon silhouette preserving original photo geometry -->
    <g :mask="`url(#${maskId})`">
      <path
        class="ascend-pin-dark"
        d="M 13.6 3.1 Q 16 1.7 18.4 3.1 L 25.1 7.0 Q 27.5 8.4 27.5 11.2 L 27.5 17.4 Q 27.5 20.1 25.4 22.1 L 17.9 28.9 Q 16 30.6 14.1 28.9 L 6.6 22.1 Q 4.5 20.1 4.5 17.4 L 4.5 11.2 Q 4.5 8.4 6.9 7.0 Z"
        :fill="`url(#${gradDarkId})`"
      />
      <path
        class="ascend-pin-light hidden"
        d="M 13.6 3.1 Q 16 1.7 18.4 3.1 L 25.1 7.0 Q 27.5 8.4 27.5 11.2 L 27.5 17.4 Q 27.5 20.1 25.4 22.1 L 17.9 28.9 Q 16 30.6 14.1 28.9 L 6.6 22.1 Q 4.5 20.1 4.5 17.4 L 4.5 11.2 Q 4.5 8.4 6.9 7.0 Z"
        :fill="`url(#${gradLightId})`"
      />
      <path
        d="M 5.6 10.6 Q 5.6 8.8 7.4 7.7 L 13.8 4.0 Q 16 2.7 18.2 4.0 L 24.6 7.7 Q 26.4 8.8 26.4 10.6"
        :stroke="`url(#${sheenId})`"
        stroke-width="1.25"
        stroke-linecap="round"
      />
    </g>
  </svg>
</template>
