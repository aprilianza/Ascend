<script setup lang="ts">
import { ChevronsUp, Equal, AlertTriangle, CircleDot } from 'lucide-vue-next'
import type { AreaLabel } from '~/types/areas'
import { LABEL_META } from '~/utils/uiCopy'

const props = withDefaults(
  defineProps<{
    label: AreaLabel
    size?: 'sm' | 'md'
    uppercase?: boolean
  }>(),
  {
    size: 'sm',
    uppercase: false,
  },
)

const settings = useAscendSettings()
const meta = computed(() => LABEL_META[props.label])
const localizedTitle = computed(() => settings.labelText.value[props.label].title)
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 rounded-full font-mono font-bold tracking-[0.06em] border select-none"
    :class="[
      size === 'sm' ? 'px-2.5 py-0.5 text-[10px]' : 'px-3 py-1 text-[11px]',
      uppercase ? 'uppercase' : '',
    ]"
    :style="{
      color: meta.color,
      backgroundColor: meta.bgTint,
      borderColor: meta.borderTint,
    }"
  >
    <ChevronsUp v-if="label === 'opportunity'" class="w-3.5 h-3.5 shrink-0" :stroke-width="2.2" />
    <Equal v-else-if="label === 'fair'" class="w-3.5 h-3.5 shrink-0" :stroke-width="2.2" />
    <AlertTriangle v-else-if="label === 'crowded'" class="w-3 h-3 shrink-0" :stroke-width="2.2" />
    <CircleDot v-else class="w-3 h-3 shrink-0" :stroke-width="2.2" />
    <span>{{ localizedTitle }}</span>
  </span>
</template>
