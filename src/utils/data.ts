import users from '../data/users.json'
import meetings from '../data/meetings.json'
import activityLogs from '../data/activity-logs.json'

export function getUsers() {
  return users
}

export function getUserById(id: string) {
  return users.find((user) => user.id === id)
}

export function getUserName(user: any) {
  if (!user) return 'Unknown'
  return `${user.courtesy} ${user.firstName} ${user.lastName}`
}

export function getMeetings() {
  return meetings
}

export function getMeetingById(id: string) {
  return meetings.find((meeting) => meeting.id === id)
}

export function getActivityLogs(meetingId: string) {
  return (activityLogs as Record<string, unknown[]>)[meetingId] || []
}

export function formatDate(dateStr: string) {
  const date = new Date(`${dateStr}T00:00:00`)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatTimeRange(start: string, end: string) {
  return `${start} - ${end}`
}

export function getStatusBadge(status: string) {
  const map = {
    scheduled: 'badge-info',
    completed: 'badge-success',
    pending: 'badge-warning',
    processing: 'badge-warning',
    archived: 'badge-neutral',
    cancelled: 'badge-danger',
  }
  return (map as Record<string, string>)[status] || 'badge-neutral'
}

export function getFileTypeIcon(type: string) {
  const map = {
    document: 'DOC',
    video: 'VID',
    spreadsheet: 'XLS',
    other: 'FILE',
  }
  return (map as Record<string, string>)[type] || 'FILE'
}
