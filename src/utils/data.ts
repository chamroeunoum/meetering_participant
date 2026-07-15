import usersData from '../data/users.json'
import meetingsData from '../data/meetings.json'
import roomsData from '../data/rooms.json'
import activityLogsData from '../data/activity-logs.json'

export interface User {
  id: string
  courtesy: string
  firstName: string
  lastName: string
  email: string
  phone: string
  organization: string
  position: string
  role: string
  active: boolean
  avatar: string
}

export interface MeetingParticipant {
  id: string
  userId: string
  role: string
  group: string
}

export interface EnrichedParticipant extends MeetingParticipant {
  user?: User
  fullName: string
}

export interface AgendaItem {
  id: string
  topic: string
  start_time: string
  duration: number
  handlerIds: string[]
}

export interface DocFile {
  id: string
  name: string
  url: string
}

export interface DocSections {
  ministerPreeng: DocFile[]
  seichdeyPreeng: DocFile[]
  techReports: DocFile[]
  reports: DocFile[]
  otherDocuments: DocFile[]
}

export interface ChecklistItem {
  id: string
  item_name: string
  equipment_status: 'working' | 'failed'
  is_checked: boolean
  checked_at: string | null
}

export interface LegalDraft {
  id: string
  title: string
  status: string
  version_number: number
  regulator: string
  pdf_url: string
  docx_url: string
}

export interface Meeting {
  id: string
  title: string
  objective: string
  date: string
  startTime: string
  endTime: string
  venue: string
  roomId: string
  coordinatorId: string
  attendeeIds: string[]
  type: { id: number; name: string }
  route: string
  participants: MeetingParticipant[]
  seatAssignments: Record<string, string>
  docSections: DocSections
  checklist: { pre: ChecklistItem[]; post: ChecklistItem[] }
  legalDraft: LegalDraft | null
  meetingLink: string
  meetingCode: string
  status: string
  category: string
  meetingType?: string
  meetingMode?: string
  level?: string
  expectedAttendees?: string
  vip?: string
  notes: string
  documents: unknown[]
  agenda: AgendaItem[]
  survey: unknown
  analytics: unknown
}

export interface RoomSeatConfig {
  id: string
  headTableSeats: number
  sideRows: number
  sideCols: number
  audienceRows: number
  audienceCols: number
}

export interface RoomSeat {
  id: string
  seat_number: string
  row_number: number
  column_number: number
  seat_type: 'head_table' | 'side_row' | 'audience'
}

const users = usersData as unknown as User[]
const meetings = meetingsData as unknown as Meeting[]
const rooms = roomsData as unknown as RoomSeatConfig[]
const activityLogs = activityLogsData as unknown as Record<
  string,
  { id: string; action: string; user: string; timestamp: string }[]
>

export function getUsers(): User[] {
  return users
}

export function getUserById(id: string): User | undefined {
  return users.find((user) => user.id === id)
}

export function getUserName(user?: User | null): string {
  if (!user) return 'មិនស្គាល់'
  return `${user.courtesy} ${user.firstName} ${user.lastName}`
}

export function getMeetings(): Meeting[] {
  return meetings
}

export function getMeetingById(id: string): Meeting | undefined {
  return meetings.find((meeting) => meeting.id === id)
}

export function getActivityLogs(meetingId: string) {
  return activityLogs[meetingId] || []
}

export function formatDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatTimeRange(start: string, end: string): string {
  return `${start} - ${end}`
}

const STATUS_BADGES: Record<string, string> = {
  scheduled: 'badge-info',
  completed: 'badge-success',
  pending: 'badge-warning',
  processing: 'badge-warning',
  archived: 'badge-neutral',
  cancelled: 'badge-danger',
}

export function getStatusBadge(status: string): string {
  return STATUS_BADGES[status] || 'badge-neutral'
}

const FILE_TYPE_ICONS: Record<string, string> = {
  document: 'DOC',
  video: 'VID',
  spreadsheet: 'XLS',
  other: 'FILE',
}

export function getFileTypeIcon(type: string): string {
  return FILE_TYPE_ICONS[type] || 'FILE'
}

// ───────────────────────────────────────────────────────────────────────
// Meeting detail page helpers (agenda / seating / participants)
// ───────────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  leader: 'ប្រធាន',
  deputy_leader: 'អនុប្រធាន',
  member: 'សមាជិក',
}

export function roleLabel(role?: string): string {
  return (role && ROLE_LABELS[role]) || role || 'មិនស្គាល់'
}

const GROUP_LABELS: Record<string, string> = {
  lead_meeting: 'ក្រុមដឹកនាំកិច្ចប្រជុំ',
  defender: 'អ្នកការពារ',
  audient: 'អ្នកចូលរួម',
}

export function groupLabel(group?: string): string {
  return (group && GROUP_LABELS[group]) || group || 'មិនស្គាល់'
}

export function enrichParticipant(p: MeetingParticipant): EnrichedParticipant {
  const user = getUserById(p.userId)
  return { ...p, user, fullName: user ? `${user.firstName} ${user.lastName}` : 'មិនស្គាល់' }
}

export function getMeetingParticipants(meeting: Meeting): EnrichedParticipant[] {
  return (meeting.participants || []).map(enrichParticipant)
}

export function getMeetingRooms(meeting: Meeting): { id: string; name: string }[] {
  return meeting.roomId ? [{ id: meeting.roomId, name: meeting.venue }] : []
}

export function getMeetingOrganizations(meeting: Meeting): string[] {
  const orgs = new Set<string>()
  getMeetingParticipants(meeting).forEach((p) => {
    if (p.user?.organization) orgs.add(p.user.organization)
  })
  return Array.from(orgs)
}

export function formatDuration(minutes: number): string {
  const mins = Number(minutes) || 0
  const h = Math.floor(mins / 60)
  const r = mins % 60
  if (h > 0 && r > 0) return `${h} ម៉ោង ${r} នាទី`
  if (h > 0) return `${h} ម៉ោង`
  return `${r} នាទី`
}

export function getRoomSeats(roomId: string): RoomSeat[] {
  const config = rooms.find((r) => r.id === roomId)
  if (!config) return []
  const seats: RoomSeat[] = []
  let n = 0
  for (let c = 1; c <= config.headTableSeats; c++) {
    n++
    seats.push({ id: `${roomId}-ht-${c}`, seat_number: String(n), row_number: 1, column_number: c, seat_type: 'head_table' })
  }
  for (let r = 1; r <= config.sideRows; r++) {
    for (let c = 1; c <= config.sideCols; c++) {
      n++
      seats.push({ id: `${roomId}-sr-${r}-${c}`, seat_number: String(n), row_number: r + 1, column_number: c, seat_type: 'side_row' })
    }
  }
  for (let r = 1; r <= config.audienceRows; r++) {
    for (let c = 1; c <= config.audienceCols; c++) {
      n++
      seats.push({ id: `${roomId}-aud-${r}-${c}`, seat_number: String(n), row_number: r, column_number: c, seat_type: 'audience' })
    }
  }
  return seats
}
