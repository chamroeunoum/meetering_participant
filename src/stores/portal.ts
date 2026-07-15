import { ref } from 'vue'
import { defineStore } from 'pinia'

export interface Visitor {
  name: string
  title: string
  avatar: string
}

export const usePortalStore = defineStore('portal', () => {
  const hasAccess = ref(false)
  const accessCode = ref('')
  const contactInfo = ref('')
  const activePortal = ref('')
  const visitor = ref<Visitor | null>(null)

  function grantAccess(code: string) {
    accessCode.value = code
    hasAccess.value = true
    visitor.value = {
      name: 'ភ្ញៀវចូលរួម',
      title: 'Participant',
      avatar: 'ភ',
    }
  }

  function grantAccessByContact(contact: string) {
    contactInfo.value = contact
    hasAccess.value = true
    const isEmail = contact.includes('@')
    const name = isEmail ? contact.split('@')[0] : contact
    visitor.value = {
      name: name,
      title: isEmail ? 'Email' : 'ទូរស័ព្ទ',
      avatar: name.charAt(0).toUpperCase(),
    }
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
    contactInfo.value = ''
    activePortal.value = ''
    visitor.value = null
  }

  return {
    hasAccess,
    accessCode,
    contactInfo,
    activePortal,
    visitor,
    grantAccess,
    grantAccessByContact,
    setActivePortal,
    clearActivePortal,
    reset,
  }
})
