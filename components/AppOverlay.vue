<script lang="ts">
const openOverlays = new Set<symbol>()
</script>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
const props = defineProps<{ open: boolean; label: string }>()
const emit = defineEmits<{ close: [] }>()
const dialog = ref<HTMLDialogElement | null>(null)
const token = Symbol('overlay')
let returnFocus: HTMLElement | null = null

const focusable = () => [...(dialog.value?.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, [tabindex]') || [])]
  .filter((element) => !element.matches(':disabled, [tabindex="-1"]') && element.getClientRects().length > 0)

const focusFirst = () => (focusable()[0] || dialog.value)?.focus()

const release = () => {
  openOverlays.delete(token)
  document.body.classList.toggle('is-overlay-open', openOverlays.size > 0)
}

watch(() => props.open, async (open: boolean) => {
  if (!import.meta.client) return
  if (open) {
    openOverlays.add(token)
    document.body.classList.add('is-overlay-open')
    returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    await nextTick()
    if (props.open && dialog.value && !dialog.value.open) { dialog.value.showModal(); focusFirst(); document.addEventListener('keydown', trapTab, true) }
  } else {
    dialog.value?.close()
    document.removeEventListener('keydown', trapTab, true)
    release()
    if (openOverlays.size === 0 && returnFocus?.isConnected) returnFocus.focus()
  }
}, { flush: 'post' })

onMounted(() => {
  if (props.open) {
    openOverlays.add(token)
    document.body.classList.add('is-overlay-open')
    dialog.value?.showModal()
    focusFirst()
    document.addEventListener('keydown', trapTab, true)
  }
})
onBeforeUnmount(() => {
  dialog.value?.close()
  document.removeEventListener('keydown', trapTab, true)
  release()
})

const trapTab = (event: KeyboardEvent) => {
  if (event.key !== 'Tab' || !dialog.value) return
  const controls = focusable()
  const first = controls[0]
  const last = controls.at(-1)
  if (!first) { event.preventDefault(); dialog.value.focus(); return }
  if (!dialog.value.contains(document.activeElement)) { event.preventDefault(); first.focus(); return }
  if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.value)) {
    event.preventDefault(); last?.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault(); first.focus()
  }
}
</script>

<template>
  <dialog ref="dialog" class="app-overlay" :aria-label="label" tabindex="-1" @cancel.prevent="emit('close')" @keydown="trapTab">
    <slot v-if="open" />
  </dialog>
</template>

<style scoped>
.app-overlay { position: fixed; inset: 0; width: 100%; height: 100dvh; max-width: none; max-height: none; margin: 0; padding: 0; border: 0; background: transparent; color: inherit; }
.app-overlay::backdrop { background: transparent; }
</style>
