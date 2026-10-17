import { nextTick, onBeforeUnmount, watch } from 'vue'

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function useFocusTrap(containerRef, activo) {
  let restoreEl = null

  function onKeydown(e) {
    if (e.key !== 'Tab' || !containerRef.value) return
    const root = containerRef.value
    const nodes = [...root.querySelectorAll(FOCUSABLE)].filter(
      (el) => !el.closest('[hidden]') && el.offsetParent !== null,
    )
    if (root.matches(FOCUSABLE) && !nodes.includes(root)) nodes.unshift(root)
    if (!nodes.length) return
    const first = nodes[0]
    const last = nodes[nodes.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  watch(activo, async (abierto) => {
    if (abierto) {
      restoreEl = document.activeElement
      await nextTick()
      containerRef.value?.focus()
      document.addEventListener('keydown', onKeydown)
    } else {
      document.removeEventListener('keydown', onKeydown)
      restoreEl?.focus?.()
      restoreEl = null
    }
  })

  onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
}
