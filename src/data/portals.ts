export interface PortalSection {
  id: string
  title: string
  icon: string
}

export interface Portal {
  id: string
  title: string
  description: string
  label: string
  icon: string
  section: string
}

export const portalSections: PortalSection[] = [
  {
    id: 'meetings',
    title: 'កិច្ចប្រជុំ',
    icon: 'calendar',
  },
]

export const portals: Portal[] = [
  {
    id: 'meeting-viewer',
    title: 'មើលកិច្ចប្រជុំ',
    description: 'មើលព័ត៌មានកិច្ចប្រជុំតាមលេខកូដ ឬ QR Code',
    label: 'Viewer with Code',
    icon: 'qrCode',
    section: 'meetings',
  },
  {
    id: 'viewer-calendar',
    title: 'មើលប្រតិទិនកិច្ចប្រជុំ',
    description: 'មើលកាលវិភាគកិច្ចប្រជុំ និងព័ត៌មានពាក់ព័ន្ធ',
    label: 'Viewer Calendar',
    icon: 'calendar',
    section: 'meetings',
  },
  {
    id: 'attendance',
    title: 'ផ្ទៀងផ្ទាត់អ្នកចូលរួម',
    description: 'ផ្ទៀងផ្ទាត់ការចូលរួម និងព័ត៌មានអ្នកចូលរួម',
    label: 'Participant Verify',
    icon: 'shieldCheck',
    section: 'meetings',
  },
  {
    id: 'guide',
    title: 'មគ្គុទេសក៍ទីតាំង',
    description: 'មើលផ្លូវ និងទីតាំងបន្ទប់ប្រជុំ',
    label: 'Guide Participant',
    icon: 'bookOpen',
    section: 'meetings',
  },
]
