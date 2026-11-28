import type { DirectiveBinding } from 'vue'

interface RevealOptions {
  variant?: 'up' | 'left' | 'right' | 'scale' | 'clip'
  delay?: number
}

type RevealValue = RevealOptions | number | undefined

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('reveal', {
    getSSRProps() {
      return {}
    },
    mounted(el: HTMLElement, binding: DirectiveBinding<RevealValue>) {
      const val = binding.value
      const variant = typeof val === 'object' && val?.variant ? val.variant : 'up'
      const delay = typeof val === 'number' ? val : (typeof val === 'object' && val?.delay ? val.delay : 0)

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return
      }

      el.classList.add('reveal-el', `reveal-${variant}`)
      if (delay > 0) {
        el.style.transitionDelay = `${delay}ms`
      }

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              el.classList.add('is-revealed')
              observer.unobserve(el)
            }
          }
        },
        {
          threshold: 0.01,
          rootMargin: '0px 0px -24px 0px',
        },
      )

      observer.observe(el)
      ;(el as HTMLElement & { __ascendRevealObs?: IntersectionObserver }).__ascendRevealObs = observer
    },
    unmounted(el: HTMLElement) {
      const obs = (el as HTMLElement & { __ascendRevealObs?: IntersectionObserver }).__ascendRevealObs
      obs?.disconnect()
    },
  })
})
