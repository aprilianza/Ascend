<script setup lang="ts">
withDefaults(
  defineProps<{
    direction?: 'right' | 'left' | 'up-left'
    leaderLength?: number
  }>(),
  {
    direction: 'right',
    leaderLength: 42,
  },
)
</script>

<template>
  <span class="inline-flex items-center pointer-events-none select-none" aria-hidden="true">
    <svg
      v-if="direction === 'right'"
      :width="18 + leaderLength"
      height="20"
      :viewBox="`0 0 ${18 + leaderLength} 20`"
      fill="none"
    >
      <polygon
        points="9,2 16,6 16,14 9,18 2,14 2,6"
        fill="#0F1115"
        fill-opacity="0.7"
        stroke="#10B981"
        stroke-width="2"
      />
      <circle cx="9" cy="10" r="2" fill="#10B981" />
      <line x1="16" y1="10" :x2="16 + leaderLength" y2="10" stroke="#10B981" stroke-width="1" />
      <circle :cx="16 + leaderLength" cy="10" r="2" fill="#10B981" />
    </svg>

    <svg
      v-else-if="direction === 'left'"
      :width="18 + leaderLength"
      height="20"
      :viewBox="`0 0 ${18 + leaderLength} 20`"
      fill="none"
    >
      <circle cx="2" cy="10" r="2" fill="#10B981" />
      <line x1="2" y1="10" :x2="leaderLength + 2" y2="10" stroke="#10B981" stroke-width="1" />
      <polygon
        :points="`${leaderLength + 9},2 ${leaderLength + 16},6 ${leaderLength + 16},14 ${leaderLength + 9},18 ${leaderLength + 2},14 ${leaderLength + 2},6`"
        fill="#0F1115"
        fill-opacity="0.7"
        stroke="#10B981"
        stroke-width="2"
      />
      <circle :cx="leaderLength + 9" cy="10" r="2" fill="#10B981" />
    </svg>

    <svg
      v-else
      width="74"
      height="48"
      viewBox="0 0 74 48"
      fill="none"
    >
      <polyline
        points="62,36 32,36 16,12"
        stroke="#10B981"
        stroke-width="1"
        fill="none"
      />
      <circle cx="16" cy="12" r="2.2" fill="#10B981" />
      <polygon
        points="62,28 69,32 69,40 62,44 55,40 55,32"
        fill="#0F1115"
        fill-opacity="0.85"
        stroke="#10B981"
        stroke-width="2"
      />
      <circle cx="62" cy="36" r="2" fill="#10B981" />
    </svg>
  </span>
</template>
