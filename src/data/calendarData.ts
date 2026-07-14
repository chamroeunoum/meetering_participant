import meetingsJson from './calendar-meetings.json'
import usersJson from './calendar-users.json'

export interface CalendarMeeting {
  id: string
  title: string
  date: string
  startTime: string
  endTime: string
  venue: string
  attendeeIds: string[]
  [key: string]: any
}

export interface CalendarUser {
  id: string
  courtesy: string
  firstName: string
  lastName: string
  avatar: string
  [key: string]: any
}

export const calendarMeetings = meetingsJson as CalendarMeeting[]
export const calendarUsers = usersJson as CalendarUser[]
export const calendarPreviewTitles: Record<string, string> = {
  m1: 'Q4 Digital Transformation Review',
  m2: 'Product Sprint Planning',
  m3: 'Board Committee Review',
}

export function getCalendarMeetings() {
  return calendarMeetings.slice().sort((left, right) =>
    `${left.date} ${left.startTime}`.localeCompare(`${right.date} ${right.startTime}`),
  )
}

export function getCalendarUserById(id: string) {
  return calendarUsers.find((user) => user.id === id)
}

export function getCalendarUserName(user?: CalendarUser) {
  return user ? `${user.courtesy} ${user.firstName} ${user.lastName}` : 'Unknown'
}

export function formatCalendarDate(dateString: string) {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
  })
}

export function formatCalendarTime(start: string, end: string) {
  return `${start} - ${end}`
}

export function toKhmerNumeral(value: string | number) {
  const digits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩']
  return String(value).replace(/\d/g, (digit) => digits[Number(digit)]!)
}

export function toISODate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const khmerMonthNames = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ']
export const khmerWeekdayShortNames = ['អាទិត្យ', 'ចន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍']

export function getMonthLabel(date: Date) {
  return `${khmerMonthNames[date.getMonth()]} ${toKhmerNumeral(date.getFullYear())}`
}
