<script setup lang="ts">
const router = useRouter()
const route = useRoute()
const mapTransition = useMapTransition()
const settings = useAscendSettings()

let removeGuard: (() => void) | null = null

onMounted(() => {
  settings.load()
  // Direct open or reload on /map displays the cinematic map-opening loader
  if (route.path === '/map') {
    mapTransition.startEnterMap()
  }

  removeGuard = router.beforeEach((to, from) => {
    if (to.path === '/map' && from.path !== '/map') {
      mapTransition.startEnterMap()
    } else if (from.path === '/map' && to.path !== '/map') {
      mapTransition.startExitMap()
    }
  })
})

onBeforeUnmount(() => {
  removeGuard?.()
  removeGuard = null
})
</script>

<template>
  <div class="min-h-screen bg-ground text-ink-primary antialiased">
    <NuxtPage />
    <UiMapTransitionOverlay />
  </div>
</template>
