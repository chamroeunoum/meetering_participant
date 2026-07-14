import { ref } from 'vue'
import { defineStore } from 'pinia'

export const usePortalStore = defineStore('portal', () => {
  const hasAccess = ref(false)
  const accessCode = ref('')
  const activePortal = ref('')

  function grantAccess(code: string) {
    accessCode.value = code
    hasAccess.value = true
  }

  function setActivePortal(portalId: string) {
    activePortal.value = portalId
  }

  function clearActivePortal() {
    activePortal.value = ''
  }

  function reset() {
    hasAccess.value = false
    accessCode.value = ''
    activePortal.value = ''
  }

  return {
    hasAccess,
    accessCode,
    activePortal,
    grantAccess,
    setActivePortal,
    clearActivePortal,
    reset,
  }
})
