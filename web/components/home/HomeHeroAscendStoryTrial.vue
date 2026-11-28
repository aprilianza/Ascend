<script setup lang="ts">
import { BUSINESS_STATIONS, type BusinessStationId } from '~/utils/businessStations'

const props = defineProps<{
  leftStation: BusinessStationId
  rightStation: BusinessStationId
  swapPulseSide?: 'left' | 'right' | 'both' | null
}>()

const emit = defineEmits<{
  swapWings: []
}>()

const leftMeta = computed(() => BUSINESS_STATIONS.find(s => s.id === props.leftStation) ?? BUSINESS_STATIONS[0]!)
const rightMeta = computed(() => BUSINESS_STATIONS.find(s => s.id === props.rightStation) ?? BUSINESS_STATIONS[5]!)
</script>

<template>
  <!-- LEFT & RIGHT 3D-HEX BUYER-SELLER SHOWCASE WINGS (Positioned closer to center bar, clickable to swap!) -->
  <div
    class="pointer-events-none block absolute inset-0 z-30 overflow-hidden select-none"
    aria-hidden="false"
  >
    <!-- LEFT WING SHOWCASE (Positioned closer to central search capsule on xl/2xl!) -->
    <button
      type="button"
      class="pointer-events-auto group absolute bottom-9 left-[max(14px,calc(50%-566px))] w-[206px] 2xl:w-[222px] flex flex-col items-center focus:outline-none cursor-pointer"
      :aria-label="`Featured left station: ${leftMeta.label}. Click to swap left and right stations.`"
      @click="emit('swapWings')"
    >
      <div class="relative w-full transition-transform duration-300 ease-signal group-hover:-translate-y-1.5">
        <!-- Expanding mint swap burst ring on transition -->
        <span
          v-if="props.swapPulseSide === 'left' || props.swapPulseSide === 'both'"
          :key="`ring-l-${props.leftStation}`"
          class="pointer-events-none absolute left-1/2 bottom-4 w-36 h-12 rounded-full border border-[#00E5A8]/80 wing-swap-ring"
          aria-hidden="true"
        />

        <Transition
          mode="out-in"
          enter-active-class="transition duration-500 ease-grand"
          enter-from-class="opacity-0 translate-y-6 scale-90"
          enter-to-class="opacity-100 translate-y-0 scale-100"
          leave-active-class="transition duration-250 ease-signal"
          leave-from-class="opacity-100 translate-y-0 scale-100"
          leave-to-class="opacity-0 -translate-y-4 scale-90"
        >
          <div :key="props.leftStation" class="w-full">
            <HomeNusantaraBusinessHexDiorama
              :station-id="props.leftStation"
              :highlighted="true"
              size="wing"
              :phase-offset="0"
            />
          </div>
        </Transition>
      </div>

      <span class="mt-0.5 inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-[#7DA6A0] group-hover:text-[#00E5A8] transition-colors">
        <span class="w-1.5 h-1.5 rounded-full bg-[#00E5A8]" />
        <span>{{ leftMeta.label }}</span>
      </span>
    </button>

    <!-- RIGHT WING SHOWCASE (Positioned closer to central search capsule on xl/2xl!) -->
    <button
      type="button"
      class="pointer-events-auto group absolute bottom-9 right-[max(14px,calc(50%-566px))] w-[206px] 2xl:w-[222px] flex flex-col items-center focus:outline-none cursor-pointer"
      :aria-label="`Featured right station: ${rightMeta.label}. Click to swap left and right stations.`"
      @click="emit('swapWings')"
    >
      <div class="relative w-full transition-transform duration-300 ease-signal group-hover:-translate-y-1.5">
        <span
          v-if="props.swapPulseSide === 'right' || props.swapPulseSide === 'both'"
          :key="`ring-r-${props.rightStation}`"
          class="pointer-events-none absolute left-1/2 bottom-4 w-36 h-12 rounded-full border border-[#00E5A8]/80 wing-swap-ring"
          aria-hidden="true"
        />

        <Transition
          mode="out-in"
          enter-active-class="transition duration-500 ease-grand"
          enter-from-class="opacity-0 translate-y-6 scale-90"
          enter-to-class="opacity-100 translate-y-0 scale-100"
          leave-active-class="transition duration-250 ease-signal"
          leave-from-class="opacity-100 translate-y-0 scale-100"
          leave-to-class="opacity-0 -translate-y-4 scale-90"
        >
          <div :key="props.rightStation" class="w-full">
            <HomeNusantaraBusinessHexDiorama
              :station-id="props.rightStation"
              :highlighted="true"
              size="wing"
              :phase-offset="2"
            />
          </div>
        </Transition>
      </div>

      <span class="mt-0.5 inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.16em] text-[#7DA6A0] group-hover:text-[#00E5A8] transition-colors">
        <span class="w-1.5 h-1.5 rounded-full bg-[#00E5A8]" />
        <span>{{ rightMeta.label }}</span>
      </span>
    </button>
  </div>
</template>
