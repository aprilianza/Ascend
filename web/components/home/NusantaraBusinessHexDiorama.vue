<script setup lang="ts">
import type { BusinessStationId } from '~/utils/businessStations'

const props = withDefaults(
  defineProps<{
    stationId: BusinessStationId
    highlighted?: boolean
    size?: 'strip' | 'wing'
    phaseOffset?: number
  }>(),
  {
    highlighted: false,
    size: 'strip',
    phaseOffset: 0,
  },
)

const delayStyle = computed(() => ({
  animationDelay: `${(props.phaseOffset * 0.35).toFixed(2)}s`,
}))
</script>

<template>
  <svg
    viewBox="0 0 140 112"
    :class="props.size === 'wing' ? 'w-full h-auto overflow-visible' : 'w-[132px] h-[104px] overflow-visible'"
    fill="none"
    aria-hidden="true"
  >
    <defs>
      <filter :id="`diorama-glow-${props.stationId}-${props.size}`" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2.2" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>

    <!-- =================================================================== -->
    <!-- TRUE 6-SIDED 3D ISOMETRIC HEXAGONAL PEDESTAL (Luhur Signal Spec)    -->
    <!-- Top #1C2430, Left #0F1115, Center #13171E, Right #161A21, 1px Edge  -->
    <!-- =================================================================== -->
    <g>
      <ellipse cx="70" cy="102" rx="48" ry="8.5" fill="rgba(0, 0, 0, 0.5)" />
      <!-- Left-front beveled face -->
      <polygon
        points="20,76 45,91 45,105 20,90"
        fill="#0F1115"
        stroke="#34404F"
        stroke-width="1"
        stroke-linejoin="round"
      />
      <!-- Center-front flat face -->
      <polygon
        points="45,91 95,91 95,105 45,105"
        fill="#13171E"
        stroke="#34404F"
        stroke-width="1"
        stroke-linejoin="round"
      />
      <!-- Right-front beveled face -->
      <polygon
        points="95,91 120,76 120,90 95,105"
        fill="#161A21"
        stroke="#34404F"
        stroke-width="1"
        stroke-linejoin="round"
      />
      <!-- True 6-vertex isometric hexagon top surface -->
      <polygon
        points="45,61 95,61 120,76 95,91 45,91 20,76"
        fill="#1C2430"
        stroke="#34404F"
        stroke-width="1"
        stroke-linejoin="round"
      />
      <!-- Glowing Luhur Mint opportunity hex terrace rim -->
      <polygon
        points="48,64 92,64 114,76 92,88 48,88 26,76"
        :fill="props.highlighted ? 'rgba(0, 229, 168, 0.14)' : 'rgba(16, 185, 129, 0.08)'"
        :stroke="props.highlighted ? '#00E5A8' : '#10B981'"
        :stroke-opacity="props.highlighted ? '0.92' : '0.46'"
        :stroke-width="props.highlighted ? '1.3' : '1.0'"
        class="transition-all duration-300"
      />
    </g>

    <!-- =================================================================== -->
    <!-- 1. GEROBAK: Polished Artisan Coffee Cart + Barista & Walking Buyer  -->
    <!-- =================================================================== -->
    <g v-if="props.stationId === 'gerobak'">
      <!-- Barista standing behind counter -->
      <circle cx="56" cy="36" r="3.3" fill="#ECFDF5" stroke="#00E5A8" stroke-width="0.7" />
      <line x1="56" y1="40" x2="56" y2="51" stroke="#34D399" stroke-width="2" stroke-linecap="round" />
      <!-- Offering arm with glowing warm-amber coffee cup -->
      <g class="interact-hand-offer" :style="delayStyle">
        <line x1="57" y1="44" x2="72" y2="46" stroke="#ECFDF5" stroke-width="1.6" stroke-linecap="round" />
        <rect x="72" y="42.5" width="4.5" height="5.5" rx="0.8" fill="#FBBF24" :filter="`url(#diorama-glow-${props.stationId}-${props.size})`" />
      </g>

      <!-- Striped artisanal canopy roof + awning scallops -->
      <path d="M36 28 H78 L82 35 H32 Z" fill="rgba(16,185,129,0.14)" stroke="#10B981" stroke-width="1.35" stroke-linejoin="round" />
      <path d="M44 28 V35 M57 28 V35 M70 28 V35" stroke="#00E5A8" stroke-opacity="0.45" stroke-width="0.9" />
      <path d="M33 35 C37 39, 43 39, 47 35 C51 39, 57 39, 61 35 C65 39, 71 39, 75 35 C78 39, 80 39, 82 35" stroke="#00E5A8" stroke-width="1.15" />

      <!-- Canopy posts & illuminated counter body -->
      <line x1="39" y1="38" x2="39" y2="49" stroke="#10B981" stroke-width="1.2" />
      <line x1="75" y1="38" x2="75" y2="49" stroke="#10B981" stroke-width="1.2" />
      <rect x="37" y="49" width="40" height="20" rx="2" fill="#09181B" stroke="#34D399" stroke-width="1.3" />
      <!-- Espresso machine & glowing warm display panel -->
      <rect x="42" y="42" width="8" height="7" rx="1" fill="#0D2522" stroke="#00E5A8" stroke-width="1" />
      <rect x="43" y="54" width="28" height="6" rx="1" fill="rgba(0,229,168,0.12)" stroke="#00E5A8" stroke-opacity="0.65" stroke-width="0.9" />
      <line x1="43" y1="64" x2="71" y2="64" stroke="#14B8A6" stroke-opacity="0.45" stroke-width="1" />
      <!-- Push handle & spoked wheels -->
      <path d="M37 56 L29 53" stroke="#10B981" stroke-width="1.4" stroke-linecap="round" />
      <circle cx="46" cy="73" r="5.5" fill="#071115" stroke="#00E5A8" stroke-width="1.35" />
      <circle cx="46" cy="73" r="1.8" fill="#00E5A8" />
      <circle cx="68" cy="73" r="5.5" fill="#071115" stroke="#00E5A8" stroke-width="1.35" />
      <circle cx="68" cy="73" r="1.8" fill="#00E5A8" />

      <!-- Rising coffee steam wisps -->
      <path d="M46 23 C44 19, 48 16, 46 12" stroke="#FBBF24" stroke-width="1.15" stroke-linecap="round" class="street-steam-rise" />
      <path d="M54 22 C52 18, 56 15, 54 11" stroke="#00E5A8" stroke-width="1.1" stroke-linecap="round" class="street-steam-rise-b" />

      <!-- Warm transaction spark -->
      <circle cx="80" cy="44" r="2.5" fill="#FEF08A" :filter="`url(#diorama-glow-${props.stationId}-${props.size})`" class="interact-exchange-spark" :style="delayStyle" />

      <!-- Animated Buyer walking up to receive coffee -->
      <g class="diorama-buyer-right" :style="delayStyle">
        <ellipse cx="0" cy="0" rx="5.5" ry="1.6" fill="rgba(0,229,168,0.24)" />
        <line x1="0" y1="-12" x2="-3.2" y2="-1" stroke="#34D399" stroke-width="1.6" stroke-linecap="round" class="trial-leg-a" />
        <line x1="0" y1="-12" x2="3.2" y2="-1" stroke="#00E5A8" stroke-width="1.6" stroke-linecap="round" class="trial-leg-b" />
        <line x1="0" y1="-12" x2="0" y2="-24" stroke="#ECFDF5" stroke-width="1.9" stroke-linecap="round" />
        <line x1="0" y1="-21" x2="-7" y2="-18" stroke="#FBBF24" stroke-width="1.5" stroke-linecap="round" />
        <circle cx="0" cy="-28.5" r="3.4" fill="#ECFDF5" stroke="#00E5A8" stroke-width="0.8" />
      </g>
    </g>

    <!-- =================================================================== -->
    <!-- 2. KIOS: Polished Corner Booth + Glowing OPEN Sign & Window Buyer   -->
    <!-- =================================================================== -->
    <g v-else-if="props.stationId === 'kios'">
      <!-- Sloped corner kiosk roof + illuminated signboard -->
      <path d="M40 31 L48 21 H92 L100 31 Z" fill="rgba(16,185,129,0.12)" stroke="#10B981" stroke-width="1.35" stroke-linejoin="round" />
      <rect x="57" y="15" width="26" height="7" rx="1.5" fill="#071916" stroke="#00E5A8" stroke-width="1" class="open-sign-glow" />
      <line x1="62" y1="18.5" x2="78" y2="18.5" stroke="#00E5A8" stroke-width="1.3" stroke-linecap="round" />
      <!-- Booth facade -->
      <rect x="44" y="31" width="52" height="44" rx="2" fill="#09181B" stroke="#34D399" stroke-width="1.35" />
      <!-- Illuminated counter window with seller inside -->
      <rect x="50" y="38" width="24" height="16" rx="1.5" fill="rgba(0,229,168,0.09)" stroke="#00E5A8" stroke-width="1.2" />
      <circle cx="62" cy="44.5" r="2.9" fill="#ECFDF5" />
      <path d="M56.5 54 C56.5 49.5, 67.5 49.5, 67.5 54" fill="#34D399" />
      <!-- Service ledge + coffee cups -->
      <line x1="47" y1="54" x2="77" y2="54" stroke="#00E5A8" stroke-width="1.5" stroke-linecap="round" />
      <rect x="53" y="50" width="3.2" height="4" rx="0.5" fill="#FBBF24" />
      <!-- Side door -->
      <rect x="80" y="42" width="11" height="33" rx="1" fill="rgba(16,185,129,0.08)" stroke="#10B981" stroke-width="1.2" />
      <circle cx="83" cy="59" r="1.1" fill="#FBBF24" />

      <!-- Exchange spark -->
      <circle cx="48" cy="50" r="2.4" fill="#FBBF24" :filter="`url(#diorama-glow-${props.stationId}-${props.size})`" class="interact-exchange-spark" :style="delayStyle" />

      <!-- Animated Buyer approaching kiosk counter from left -->
      <g class="diorama-buyer-left" :style="delayStyle">
        <ellipse cx="0" cy="0" rx="5.5" ry="1.6" fill="rgba(0,229,168,0.22)" />
        <line x1="0" y1="-12" x2="-3" y2="-1" stroke="#34D399" stroke-width="1.6" stroke-linecap="round" class="trial-leg-a" />
        <line x1="0" y1="-12" x2="3" y2="-1" stroke="#00E5A8" stroke-width="1.6" stroke-linecap="round" class="trial-leg-b" />
        <line x1="0" y1="-12" x2="0" y2="-24" stroke="#ECFDF5" stroke-width="1.9" stroke-linecap="round" />
        <line x1="0" y1="-21" x2="7" y2="-19" stroke="#00E5A8" stroke-width="1.5" stroke-linecap="round" />
        <circle cx="0" cy="-28.5" r="3.4" fill="#ECFDF5" stroke="#00E5A8" stroke-width="0.8" />
      </g>
    </g>

    <!-- =================================================================== -->
    <!-- 3. WARUNG: Polished Nusantara Eatery + Warm Glow & Entering Diner   -->
    <!-- =================================================================== -->
    <g v-else-if="props.stationId === 'warung'">
      <!-- Pitched Nusantara tiled roof with warm amber trim -->
      <path d="M35 33 L48 19 H92 L105 33 Z" fill="rgba(245,158,11,0.1)" stroke="#F59E0B" stroke-width="1.4" stroke-linejoin="round" />
      <path d="M39 33 C44 38, 50 38, 55 33 C60 38, 66 38, 71 33 C76 38, 82 38, 87 33 C92 38, 98 38, 103 33" stroke="#FBBF24" stroke-width="1.15" />
      <!-- Warung facade -->
      <rect x="42" y="36" width="56" height="39" rx="2" fill="#0C1718" stroke="#10B981" stroke-width="1.35" />
      <!-- Warm glowing display showcase window with dishes -->
      <rect x="48" y="43" width="24" height="16" rx="1.5" fill="rgba(245,158,11,0.24)" stroke="#FBBF24" stroke-width="1.2" class="street-warm-breathe" />
      <line x1="50" y1="51" x2="70" y2="51" stroke="#FEF08A" stroke-opacity="0.6" stroke-width="1" />
      <circle cx="55" cy="48.5" r="1.5" fill="#FEF08A" />
      <circle cx="62" cy="48.5" r="1.5" fill="#FDE68A" />
      <!-- Welcoming warm doorway -->
      <rect x="77" y="45" width="15" height="30" rx="1" fill="rgba(245,158,11,0.16)" stroke="#FBBF24" stroke-width="1.2" />
      <!-- Diner walking into the warm doorway -->
      <g class="diorama-enter-door" :style="delayStyle">
        <ellipse cx="0" cy="0" rx="5.2" ry="1.5" fill="rgba(245,158,11,0.24)" />
        <line x1="0" y1="-11" x2="-3" y2="-1" stroke="#FBBF24" stroke-width="1.5" stroke-linecap="round" class="trial-leg-a" />
        <line x1="0" y1="-11" x2="3" y2="-1" stroke="#34D399" stroke-width="1.5" stroke-linecap="round" class="trial-leg-b" />
        <line x1="0" y1="-11" x2="0" y2="-23" stroke="#FEF3C7" stroke-width="1.8" stroke-linecap="round" />
        <circle cx="0" cy="-27.5" r="3.3" fill="#FEF08A" stroke="#F59E0B" stroke-width="0.7" />
      </g>
    </g>

    <!-- =================================================================== -->
    <!-- 4. LAPAK: Polished Pop-Up Canopy Stand + Waving Seller & Buyer      -->
    <!-- =================================================================== -->
    <g v-else-if="props.stationId === 'lapak'">
      <!-- Flag & high-peaked pop-up canopy -->
      <path d="M70 18 V9 L81 13.5 L70 17" fill="rgba(251,191,36,0.3)" stroke="#FBBF24" stroke-width="1.2" class="street-flag-sway" />
      <path d="M37 35 L70 18 L103 35 Z" fill="rgba(0,229,168,0.1)" stroke="#00E5A8" stroke-width="1.4" stroke-linejoin="round" />
      <line x1="70" y1="18" x2="70" y2="35" stroke="#10B981" stroke-opacity="0.45" stroke-width="1" />
      <!-- Support poles -->
      <line x1="43" y1="35" x2="43" y2="75" stroke="#10B981" stroke-width="1.4" />
      <line x1="97" y1="35" x2="97" y2="75" stroke="#10B981" stroke-width="1.4" />
      <!-- Friendly seller behind counter waving -->
      <circle cx="60" cy="44" r="3.2" fill="#ECFDF5" />
      <line x1="60" y1="48" x2="60" y2="57" stroke="#34D399" stroke-width="1.9" />
      <line x1="61" y1="50" x2="71" y2="43" stroke="#00E5A8" stroke-width="1.5" stroke-linecap="round" class="interact-hand-offer" :style="delayStyle" />
      <!-- Display table with glowing items -->
      <rect x="45" y="56" width="50" height="19" rx="1.5" fill="#09181B" stroke="#34D399" stroke-width="1.3" />
      <rect x="52" y="51" width="6" height="5" rx="0.8" fill="rgba(251,191,36,0.35)" stroke="#FBBF24" stroke-width="0.9" />
      <rect x="64" y="52" width="8" height="4" rx="0.8" fill="rgba(0,229,168,0.28)" stroke="#00E5A8" stroke-width="0.9" />
      <line x1="51" y1="65" x2="89" y2="65" stroke="#14B8A6" stroke-opacity="0.5" stroke-width="1" />
      <!-- Buyer strolling up to browse -->
      <g class="diorama-buyer-right" :style="delayStyle">
        <ellipse cx="0" cy="0" rx="5.2" ry="1.5" fill="rgba(0,229,168,0.22)" />
        <line x1="0" y1="-11" x2="-3" y2="-1" stroke="#00E5A8" stroke-width="1.5" stroke-linecap="round" class="trial-leg-a" />
        <line x1="0" y1="-11" x2="3" y2="-1" stroke="#34D399" stroke-width="1.5" stroke-linecap="round" class="trial-leg-b" />
        <line x1="0" y1="-11" x2="0" y2="-23" stroke="#ECFDF5" stroke-width="1.8" stroke-linecap="round" />
        <circle cx="0" cy="-27.5" r="3.3" fill="#ECFDF5" stroke="#00E5A8" stroke-width="0.8" />
      </g>
    </g>

    <!-- =================================================================== -->
    <!-- 5. KELONTONG: Polished Neighborhood Grocer + Buyer Exiting w/ Bag   -->
    <!-- =================================================================== -->
    <g v-else-if="props.stationId === 'kelontong'">
      <!-- Flat signboard fascia + main shop body -->
      <rect x="38" y="24" width="64" height="10" rx="2" fill="rgba(16,185,129,0.14)" stroke="#00E5A8" stroke-width="1.3" />
      <line x1="48" y1="29" x2="92" y2="29" stroke="#34D399" stroke-opacity="0.65" stroke-width="1.3" stroke-linecap="round" />
      <rect x="40" y="34" width="60" height="41" rx="1.5" fill="#09181B" stroke="#10B981" stroke-width="1.35" />
      <!-- Illuminated neighborhood grocery window with shelves -->
      <rect x="46" y="40" width="29" height="22" rx="1" fill="rgba(16,185,129,0.06)" stroke="#34D399" stroke-width="1.1" />
      <line x1="48" y1="49" x2="73" y2="49" stroke="#14B8A6" stroke-width="1" />
      <line x1="48" y1="56" x2="73" y2="56" stroke="#14B8A6" stroke-width="1" />
      <circle cx="52" cy="46" r="1.7" fill="#00E5A8" class="street-blink-open" />
      <circle cx="60" cy="46" r="1.7" fill="#FBBF24" class="street-warm-breathe" />
      <circle cx="68" cy="46" r="1.7" fill="#34D399" class="street-blink-open" />
      <rect x="51" y="52" width="5" height="4" fill="rgba(251,191,36,0.4)" />
      <rect x="61" y="52" width="7" height="4" fill="rgba(0,229,168,0.35)" />
      <!-- Entrance door -->
      <rect x="80" y="43" width="14" height="32" rx="1" fill="rgba(16,185,129,0.12)" stroke="#00E5A8" stroke-width="1.2" />
      <!-- Buyer stepping out carrying a glowing warm-amber shopping bag -->
      <g class="diorama-exit-bag" :style="delayStyle">
        <ellipse cx="0" cy="0" rx="5.2" ry="1.5" fill="rgba(245,158,11,0.24)" />
        <line x1="0" y1="-11" x2="-3" y2="-1" stroke="#34D399" stroke-width="1.5" stroke-linecap="round" class="trial-leg-a" />
        <line x1="0" y1="-11" x2="3" y2="-1" stroke="#FBBF24" stroke-width="1.5" stroke-linecap="round" class="trial-leg-b" />
        <line x1="0" y1="-11" x2="0" y2="-23" stroke="#ECFDF5" stroke-width="1.8" stroke-linecap="round" />
        <line x1="0" y1="-19" x2="6" y2="-15" stroke="#34D399" stroke-width="1.4" stroke-linecap="round" />
        <rect x="5" y="-16" width="5.5" height="6.5" rx="1" fill="#F59E0B" stroke="#FEF08A" stroke-width="0.7" :filter="`url(#diorama-glow-${props.stationId}-${props.size})`" />
        <circle cx="0" cy="-27.5" r="3.3" fill="#ECFDF5" stroke="#FBBF24" stroke-width="0.8" />
      </g>
    </g>

    <!-- =================================================================== -->
    <!-- 6. RUKO: Polished 2-Story Commercial Row + Entering Customers       -->
    <!-- =================================================================== -->
    <g v-else-if="props.stationId === 'ruko'">
      <!-- Stepped architectural parapet roof -->
      <path d="M36 22 H104 M44 17 H96 V22 H44 Z" fill="rgba(16,185,129,0.1)" stroke="#00E5A8" stroke-width="1.25" />
      <!-- Main 2-story structure -->
      <rect x="38" y="22" width="64" height="53" rx="2" fill="#09181B" stroke="#10B981" stroke-width="1.35" />
      <!-- Balcony floor divider -->
      <line x1="36" y1="46" x2="104" y2="46" stroke="#00E5A8" stroke-width="1.3" />
      <!-- 2nd floor glowing modern office/cafe windows -->
      <rect x="44" y="28" width="14" height="12" rx="1" fill="rgba(0,229,168,0.22)" stroke="#00E5A8" stroke-width="1.05" class="street-blink-open" />
      <rect x="63" y="28" width="14" height="12" rx="1" fill="rgba(251,191,36,0.24)" stroke="#FBBF24" stroke-width="1.05" class="street-warm-breathe" />
      <rect x="82" y="28" width="14" height="12" rx="1" fill="rgba(0,229,168,0.14)" stroke="#34D399" stroke-width="1.05" />
      <!-- Ground floor glass retail storefronts -->
      <rect x="44" y="52" width="22" height="23" rx="1" fill="rgba(16,185,129,0.09)" stroke="#34D399" stroke-width="1.15" />
      <rect x="73" y="52" width="21" height="23" rx="1" fill="rgba(0,229,168,0.14)" stroke="#00E5A8" stroke-width="1.2" />
      <!-- Tiny OPEN neon marker -->
      <rect x="48" y="56" width="14" height="5.5" rx="1.5" fill="#061916" stroke="#00E5A8" stroke-width="0.9" class="open-sign-glow" />
      <!-- Customer walking into commercial ruko doorway -->
      <g class="diorama-enter-door" :style="delayStyle">
        <ellipse cx="0" cy="0" rx="5.2" ry="1.5" fill="rgba(0,229,168,0.24)" />
        <line x1="0" y1="-11" x2="-3" y2="-1" stroke="#34D399" stroke-width="1.5" stroke-linecap="round" class="trial-leg-a" />
        <line x1="0" y1="-11" x2="3" y2="-1" stroke="#00E5A8" stroke-width="1.5" stroke-linecap="round" class="trial-leg-b" />
        <line x1="0" y1="-11" x2="0" y2="-23" stroke="#ECFDF5" stroke-width="1.8" stroke-linecap="round" />
        <circle cx="0" cy="-27.5" r="3.3" fill="#ECFDF5" stroke="#00E5A8" stroke-width="0.8" />
      </g>
    </g>

    <!-- =================================================================== -->
    <!-- 7. KAKI LIMA: Polished Evening Street Tent + Lantern & Serving      -->
    <!-- =================================================================== -->
    <g v-else-if="props.stationId === 'kaki-lima'">
      <!-- Tent frame + draped evening canopy -->
      <path d="M36 29 H104 L96 36 H44 Z" fill="rgba(16,185,129,0.12)" stroke="#10B981" stroke-width="1.35" stroke-linejoin="round" />
      <line x1="42" y1="36" x2="42" y2="75" stroke="#10B981" stroke-width="1.3" />
      <line x1="98" y1="36" x2="98" y2="75" stroke="#10B981" stroke-width="1.3" />
      <!-- Warm swinging evening lantern -->
      <g class="street-lantern-swing">
        <line x1="70" y1="36" x2="70" y2="42" stroke="#FBBF24" stroke-width="1.1" />
        <circle cx="70" cy="45" r="7" fill="rgba(245,158,11,0.18)" />
        <circle cx="70" cy="45" r="3.2" fill="#FEF08A" :filter="`url(#diorama-glow-${props.stationId}-${props.size})`" class="street-warm-breathe" />
      </g>
      <!-- Street vendor serving behind glowing counter -->
      <circle cx="58" cy="47" r="3.1" fill="#ECFDF5" />
      <line x1="58" y1="51" x2="58" y2="59" stroke="#34D399" stroke-width="1.8" />
      <line x1="59" y1="53" x2="70" y2="55" stroke="#FBBF24" stroke-width="1.5" stroke-linecap="round" class="interact-hand-offer" :style="delayStyle" />
      <rect x="48" y="57" width="42" height="18" rx="1.5" fill="#09181B" stroke="#14B8A6" stroke-width="1.25" />
      <line x1="53" y1="64" x2="85" y2="64" stroke="#00E5A8" stroke-opacity="0.45" stroke-width="1" />
      <!-- Warm spark exchanged -->
      <circle cx="77" cy="53" r="2.3" fill="#FEF08A" :filter="`url(#diorama-glow-${props.stationId}-${props.size})`" class="interact-exchange-spark" :style="delayStyle" />
      <!-- Buyer arriving at evening tent -->
      <g class="diorama-buyer-right" :style="delayStyle">
        <ellipse cx="0" cy="0" rx="5.2" ry="1.5" fill="rgba(245,158,11,0.22)" />
        <line x1="0" y1="-11" x2="-3" y2="-1" stroke="#FBBF24" stroke-width="1.5" stroke-linecap="round" class="trial-leg-a" />
        <line x1="0" y1="-11" x2="3" y2="-1" stroke="#34D399" stroke-width="1.5" stroke-linecap="round" class="trial-leg-b" />
        <line x1="0" y1="-11" x2="0" y2="-23" stroke="#ECFDF5" stroke-width="1.8" stroke-linecap="round" />
        <circle cx="0" cy="-27.5" r="3.3" fill="#ECFDF5" stroke="#FBBF24" stroke-width="0.8" />
      </g>
    </g>

    <!-- =================================================================== -->
    <!-- 8. PASAR: Polished Twin-Roof Nusantara Market Hall + Entering Buyer -->
    <!-- =================================================================== -->
    <g v-else>
      <!-- Iconic twin-pitched Nusantara market hall roofline -->
      <path d="M32 37 L52 21 L70 33 L88 21 L108 37 Z" fill="rgba(0,229,168,0.09)" stroke="#00E5A8" stroke-width="1.4" stroke-linejoin="round" />
      <circle cx="52" cy="21" r="1.8" fill="#FBBF24" />
      <circle cx="88" cy="21" r="1.8" fill="#FBBF24" />
      <!-- Market hall arcade walls -->
      <rect x="38" y="37" width="64" height="38" rx="1.5" fill="#09181B" stroke="#10B981" stroke-width="1.35" />
      <!-- Side stall windows -->
      <rect x="43" y="45" width="11" height="12" rx="1" fill="rgba(16,185,129,0.12)" stroke="#34D399" stroke-width="1" />
      <rect x="86" y="45" width="11" height="12" rx="1" fill="rgba(245,158,11,0.14)" stroke="#FBBF24" stroke-width="1" class="street-warm-breathe" />
      <!-- Grand central arched entrance -->
      <path d="M58 75 V54 C58 46, 82 46, 82 54 V75 Z" fill="rgba(0,229,168,0.14)" stroke="#00E5A8" stroke-width="1.3" />
      <circle cx="70" cy="30" r="2.4" fill="#00E5A8" class="street-blink-open" />
      <!-- Shopper walking into central market arch -->
      <g class="diorama-enter-center" :style="delayStyle">
        <ellipse cx="0" cy="0" rx="5.2" ry="1.5" fill="rgba(0,229,168,0.24)" />
        <line x1="0" y1="-11" x2="-3" y2="-1" stroke="#34D399" stroke-width="1.5" stroke-linecap="round" class="trial-leg-a" />
        <line x1="0" y1="-11" x2="3" y2="-1" stroke="#00E5A8" stroke-width="1.5" stroke-linecap="round" class="trial-leg-b" />
        <line x1="0" y1="-11" x2="0" y2="-23" stroke="#ECFDF5" stroke-width="1.8" stroke-linecap="round" />
        <circle cx="0" cy="-27.5" r="3.3" fill="#ECFDF5" stroke="#00E5A8" stroke-width="0.8" />
      </g>
    </g>
  </svg>
</template>
