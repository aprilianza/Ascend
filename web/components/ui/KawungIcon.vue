<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: number
  }>(),
  {
    size: 16,
  },
)
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle cx="10" cy="10" r="8.5" stroke="currentColor" stroke-width="1.15" stroke-opacity="0.65" />
    <ellipse cx="10" cy="5.8" rx="2.1" ry="3.2" stroke="currentColor" stroke-width="1.15" />
    <ellipse cx="10" cy="14.2" rx="2.1" ry="3.2" stroke="currentColor" stroke-width="1.15" />
    <ellipse cx="5.8" cy="10" rx="3.2" ry="2.1" stroke="currentColor" stroke-width="1.15" />
    <ellipse cx="14.2" cy="10" rx="3.2" ry="2.1" stroke="currentColor" stroke-width="1.15" />
    <circle cx="10" cy="10" r="1.4" fill="currentColor" />
  </svg>
</template>
