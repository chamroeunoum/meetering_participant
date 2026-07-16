import { ref } from 'vue'
import { defineStore } from 'pinia'

const STORAGE_KEY = 'portal_session'

export interface Visitor {
  name: string
  title: string
  avatar: string
}

export type AccessType = 'meeting-code' | 'contact' | null

function loadSession(): any {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function saveSession(state: any) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch { /* ignore */ }
}

export const usePortalStore = defineStore('portal', () => {
  const saved = loadSession()

  const hasAccess = ref(saved.hasAccess ?? false)
  const accessCode = ref(saved.accessCode ?? '')
  const contactInfo = ref(saved.contactInfo ?? '')
  const activePortal = ref(saved.activePortal ?? '')
  const visitor = ref<Visitor | null>(saved.visitor ?? null)
  const accessType = ref<AccessType>(saved.accessType ?? null)
  const restrictedMeetingId = ref(saved.restrictedMeetingId ?? '')

  /** Which meeting the user is currently viewing */
  const currentMeetingId = ref(saved.currentMeetingId ?? '')
  /** The participant's ID within the current meeting */
  const currentParticipantId = ref<number | null>(saved.currentParticipantId ?? null)
  /** Set of meeting IDs the user has checked into */
  const checkedInMeetings = ref<Set<string>>(new Set(saved.checkedInMeetings ?? []))
  /** Meetings fetched via OTP verification (phone/email flow) */
  const personMeetings = ref<any[]>(saved.personMeetings ?? [])
  /** Person info from verification */
  const personInfo = ref<any>(saved.personInfo ?? null)

  function persist() {
    saveSession({
      hasAccess: hasAccess.value,
      accessCode: accessCode.value,
      contactInfo: contactInfo.value,
      activePortal: activePortal.value,
      visitor: visitor.value,
      accessType: accessType.value,
      restrictedMeetingId: restrictedMeetingId.value,
      currentMeetingId: currentMeetingId.value,
      currentParticipantId: currentParticipantId.value,
      checkedInMeetings: Array.from(checkedInMeetings.value),
      personMeetings: personMeetings.value,
      personInfo: personInfo.value,
    })
  }

  function setAccessType(type: AccessType, meetingId?: string) {
    accessType.value = type
    if (meetingId) restrictedMeetingId.value = meetingId
    persist()
  }

  function grantAccess(code: string) {
    accessCode.value = code
    hasAccess.value = true
    visitor.value = {
      name: 'ភ្ញៀវចូលរួម',
      title: 'Participant',
      avatar: 'ភ',
    }
    persist()
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
    persist()
  }

  function setCurrentMeeting(meetingId: string, participantId: number) {
    currentMeetingId.value = meetingId
    currentParticipantId.value = participantId
    persist()
  }

  function isCheckedIn(meetingId: string): boolean {
    return checkedInMeetings.value.has(meetingId)
  }

  function markCheckIn(meetingId: string) {
    const next = new Set(checkedInMeetings.value)
    next.add(meetingId)
    checkedInMeetings.value = next
    persist()
  }

  function setActivePortal(portalId: string) {
    activePortal.value = portalId
    persist()
  }

  function clearActivePortal() {
    activePortal.value = ''
    persist()
  }

  function setPersonMeetings(meetings: any[], info: any) {
    personMeetings.value = meetings
    personInfo.value = info
    persist()
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
    personMeetings.value = []
    personInfo.value = null
    localStorage.removeItem(STORAGE_KEY)
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
    personMeetings,
    personInfo,
    grantAccess,
    grantAccessByContact,
    setAccessType,
    setCurrentMeeting,
    isCheckedIn,
    markCheckIn,
    setPersonMeetings,
    setActivePortal,
    clearActivePortal,
    reset,
  }
})
