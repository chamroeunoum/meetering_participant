import { ref } from 'vue'
import { getMeetings, getMeetingById, getUserById, getUserName } from '@/utils/data'

// ─── Types ────────────────────────────────────────────────────────

export interface ParticipantContact {
  id: number
  name: string
  email: string
  telegram: string
  phone: string
  position: string
  department: string
}

export interface MeetingInvitation {
  meetingId: string
  participantId: number
  participantName: string
  email: string
  telegram: string
  phone: string
  position: string
  uniqueCode: string
  invitationSent: boolean
  sentAt: string | null
  checkedIn: boolean
  checkedInAt: string | null
}

export interface OfficerMeeting {
  id: string
  title: string
  date: string
  startTime: string
  endTime: string
  venue: string
  participantCount: number
  checkedInCount: number
}

// ─── Contact data for participants ────────────────────────────────

export const participantContacts: ParticipantContact[] = [
  { id: 1, name: 'ឯកឧត្តម ហ៊ីង ថូរ៉ាក់ស៊ី', email: 'hing.thoraksy@ocm.gov.kh', telegram: '@hing_thoraksy', phone: '+855 12 345 678', position: 'រដ្ឋលេខាធិការប្រចាំការ', department: 'ទីស្តីការគណៈរដ្ឋមន្ត្រី' },
  { id: 2, name: 'ឯកឧត្តម ឆាយ រៀន', email: 'chhay.rien@ocm.gov.kh', telegram: '@chhay_rien', phone: '+855 12 345 679', position: 'រដ្ឋលេខាធិការ', department: 'នាយកដ្ឋានសម្របសម្រួលគោលនយោបាយ' },
  { id: 3, name: 'ឯកឧត្តម អេង ទូច', email: 'eng.touch@ocm.gov.kh', telegram: '@eng_touch', phone: '+855 12 345 680', position: 'រដ្ឋលេខាធិការ', department: 'នាយកដ្ឋានបម្លែងឌីជីថល' },
  { id: 4, name: 'ឯកឧត្តមបណ្ឌិត ស៊ា ម៉ៅ', email: 'sea.mao@ocm.gov.kh', telegram: '@sea_mao', phone: '+855 12 345 681', position: 'អនុរដ្ឋលេខាធិការ', department: 'នាយកដ្ឋានរដ្ឋបាល' },
  { id: 5, name: 'ឯកឧត្តម លី ច័ន្ទតុលា', email: 'ly.chantola@ocm.gov.kh', telegram: '@ly_chantola', phone: '+855 12 345 682', position: 'អគ្គនាយក', department: 'នាយកដ្ឋានហិរញ្ញវត្ថុ និងលទ្ធកម្ម' },
  { id: 6, name: 'ឯកឧត្តម អ៊ឹង សេរីវិសុទ្ធ', email: 'eung.sereyvissoth@ocm.gov.kh', telegram: '@eung_sereyvissoth', phone: '+855 12 345 683', position: 'អគ្គនាយករង', department: 'នាយកដ្ឋានធនធានមនុស្ស' },
  { id: 7, name: 'ឯកឧត្តម លីវ សុវណ្ណ', email: 'liv.sovann@ocm.gov.kh', telegram: '@liv_sovann', phone: '+855 12 345 684', position: 'ប្រធាននាយកដ្ឋាន', department: 'នាយកដ្ឋានកិច្ចការច្បាប់' },
  { id: 8, name: 'ឯកឧត្តម ឃីម រស្មីដា', email: 'khim.reasmeyda@ocm.gov.kh', telegram: '@khim_reasmeyda', phone: '+855 12 345 685', position: 'ប្រធានការិយាល័យ', department: 'នាយកដ្ឋានពិធីការ' },
]

// ─── All existing codes (for uniqueness check) ───────────────────

let allExistingCodes = new Set<string>()

export function initCodeTracker(existingCodes: string[]) {
  allExistingCodes = new Set(existingCodes)
}

// ─── Code generation ──────────────────────────────────────────────

function generateUniqueCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no 0/O/1/I
  let code = ''
  for (let tries = 0; tries < 100; tries++) {
    let random = ''
    for (let i = 0; i < 6; i++) random += chars[Math.floor(Math.random() * chars.length)]
    code = `OCM-${random}`
    if (!allExistingCodes.has(code)) {
      allExistingCodes.add(code)
      return code
    }
  }
  return `OCM-${Date.now().toString(36).toUpperCase()}`
}

// ─── Reactive invitation store ───────────────────────────────────

const invitations = ref<MeetingInvitation[]>([])
const selectedMeetingId = ref('')

const meetingMap = new Map<string, number[]>() // meetingId → participantIds

// Return available meetings for the officer UI
export function getOfficerMeetings(): OfficerMeeting[] {
  return getMeetings().map((m) => {
    const invs = invitations.value.filter((i) => i.meetingId === m.id)
    return {
      id: m.id,
      title: m.title || m.objective,
      date: m.date,
      startTime: m.startTime,
      endTime: m.endTime,
      venue: m.venue,
      participantCount: m.participants?.length || 0,
      checkedInCount: invs.filter((i) => i.checkedIn).length,
    }
  })
}

export function getMeetingInvitations(meetingId: string): MeetingInvitation[] {
  return invitations.value.filter((i) => i.meetingId === meetingId)
}

export function selectMeeting(meetingId: string) {
  selectedMeetingId.value = meetingId
}

export function getSelectedMeetingId() {
  return selectedMeetingId
}

// Load participants for a meeting (from meetings.json participants array + contacts)
export function loadMeetingParticipants(meetingId: string) {
  const meeting = getMeetingById(meetingId)
  if (!meeting) return

  // Remove existing invitations for this meeting
  invitations.value = invitations.value.filter((i) => i.meetingId !== meetingId)

  const participantIds = meeting.participants?.map((p: any) => p.userId) || []
  const meetingAttendees = meeting.attendeeIds || []

  // Map userIds to our contact IDs (u1 → 1, u2 → 2, etc.)
  const newInvitations: MeetingInvitation[] = []
  const seenIds = new Set<number>()

  for (const uid of [...participantIds, ...meetingAttendees]) {
    const contactId = parseInt(uid.replace('u', ''))
    if (seenIds.has(contactId)) continue
    seenIds.add(contactId)

    const contact = participantContacts.find((c) => c.id === contactId)
    if (!contact) continue

    newInvitations.push({
      meetingId,
      participantId: contact.id,
      participantName: contact.name,
      email: contact.email,
      telegram: contact.telegram,
      phone: contact.phone,
      position: contact.position,
      uniqueCode: '',
      invitationSent: false,
      sentAt: null,
      checkedIn: false,
      checkedInAt: null,
    })
  }

  invitations.value = [...invitations.value, ...newInvitations]
}

// Generate unique codes for all participants in a meeting
export function generateCodesForMeeting(meetingId: string) {
  invitations.value = invitations.value.map((inv) => {
    if (inv.meetingId !== meetingId) return inv
    if (inv.uniqueCode) return inv // already has a code
    return { ...inv, uniqueCode: generateUniqueCode() }
  })
}

// Generate a single code for a specific participant
export function generateSingleCode(meetingId: string, participantId: number) {
  invitations.value = invitations.value.map((inv) => {
    if (inv.meetingId !== meetingId || inv.participantId !== participantId) return inv
    if (inv.uniqueCode) return inv
    return { ...inv, uniqueCode: generateUniqueCode() }
  })
}

// Mark invitation as sent
export function markInvitationSent(meetingId: string, participantId: number) {
  invitations.value = invitations.value.map((inv) => {
    if (inv.meetingId !== meetingId || inv.participantId !== participantId) return inv
    return { ...inv, invitationSent: true, sentAt: new Date().toISOString() }
  })
}

// Mark invitation as unsent
export function markInvitationUnsent(meetingId: string, participantId: number) {
  invitations.value = invitations.value.map((inv) => {
    if (inv.meetingId !== meetingId || inv.participantId !== participantId) return inv
    return { ...inv, invitationSent: false, sentAt: null }
  })
}

// Initialize code tracker with existing codes
export function initInvitationSystem() {
  const allCodes = new Set<string>()
  // We'll populate this as codes are generated
  allExistingCodes = allCodes
}
