import { ref } from 'vue'
import { defineStore } from 'pinia'

export interface Visitor {
  name: string
  title: string
  avatar: string
}

export type AccessType = 'meeting-code' | 'contact' | null

export const usePortalStore = defineStore('portal', () => {
  const hasAccess = ref(false)
  const accessCode = ref('')
  const contactInfo = ref('')
  const activePortal = ref('')
  const visitor = ref<Visitor | null>(null)
  const accessType = ref<AccessType>(null)
  const restrictedMeetingId = ref('')

  /** Which meeting the user is currently viewing */
  const currentMeetingId = ref('')
  /** The participant's ID within the current meeting */
  const currentParticipantId = ref<number | null>(null)
  /** Set of meeting IDs the user has checked into */
  const checkedInMeetings = ref<Set<string>>(new Set())

  function setAccessType(type: AccessType, meetingId?: string) {
    accessType.value = type
    if (meetingId) restrictedMeetingId.value = meetingId
  }

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

  function setCurrentMeeting(meetingId: string, participantId: number) {
    currentMeetingId.value = meetingId
    currentParticipantId.value = participantId
  }

  function isCheckedIn(meetingId: string): boolean {
    return checkedInMeetings.value.has(meetingId)
  }

  function markCheckIn(meetingId: string) {
    const next = new Set(checkedInMeetings.value)
    next.add(meetingId)
    checkedInMeetings.value = next
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
    accessType.value = null
    restrictedMeetingId.value = ''
    currentMeetingId.value = ''
    currentParticipantId.value = null
    checkedInMeetings.value = new Set()
  }

  return {
    hasAccess,
    accessCode,
    contactInfo,
    activePortal,
    visitor,
    accessType,
    restrictedMeetingId,
    currentMeetingId,
    currentParticipantId,
    checkedInMeetings,
    grantAccess,
    grantAccessByContact,
    setAccessType,
    setCurrentMeeting,
    isCheckedIn,
    markCheckIn,
    setActivePortal,
    clearActivePortal,
    reset,
  }
})
