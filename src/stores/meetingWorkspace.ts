import { reactive } from 'vue'
import { defineStore } from 'pinia'
import {
  getMeetingById,
  getUserById,
  type AgendaItem,
  type DocSections,
  type LegalDraft,
  type MeetingParticipant,
  type User,
} from '@/utils/data'

export interface DraftReply {
  id: string
  text: string
  creator: string
  created_at: string
}

export interface HighlightRect {
  x: number
  y: number
  w: number
  h: number
}

export interface DraftComment {
  id: string
  page_number: number
  selected_text: string
  comment: string
  creator: string
  created_at: string
  rects: HighlightRect[]
  replies: DraftReply[]
}

export interface DraftNote {
  id: string
  note: string
  creator: string
  created_at: string
}

export interface DraftVersion {
  id: string
  version_number: number
  status: string
  message: string
  actor: string
  created_at: string
  pdf_url: string
}

export interface EnrichedParticipant extends MeetingParticipant {
  user?: User
  fullName: string
}

export interface MeetingWorkspace {
  agendas: AgendaItem[]
  participants: MeetingParticipant[]
  seatAssignments: Record<string, string>
  docSections: DocSections
  legalDraft: LegalDraft | null
  draftVersions: DraftVersion[]
  selectedDraftVersionId: string | null
  comments: DraftComment[]
  notes: DraftNote[]
}

function emptyDocSections(): DocSections {
  return { ministerPreeng: [], seichdeyPreeng: [], techReports: [], reports: [], otherDocuments: [] }
}

function buildDraftVersions(draft: LegalDraft): DraftVersion[] {
  const latest = draft.version_number || 1
  const versions: DraftVersion[] = []
  const messages: Record<number, string> = {
    [latest]: 'កំណែបច្ចុប្បន្ន — កំពុងត្រៀមសម្រាប់អនុម័តក្នុងកិច្ចប្រជុំនេះ',
  }
  for (let v = latest; v >= 1; v--) {
    versions.push({
      id: `${draft.id}-v${v}`,
      version_number: v,
      status: v === latest ? draft.status : 'final',
      message: messages[v] || `កំណែទី ${v} — កែសម្រួលដោយក្រុមការងារគតិយុត្ត`,
      actor: draft.regulator || 'ក្រុមការងារគតិយុត្ត',
      created_at: '',
      pdf_url: draft.pdf_url,
    })
  }
  return versions
}

function nowStamp(): string {
  return new Date().toLocaleString('km-KH')
}

/**
 * Session-only workspace for meeting-detail edits (agenda, reference documents,
 * draft comments/notes/versions). There is no backend in this app, so every
 * mutation here only lives for the current browser session, seeded from the
 * static mock data in src/data on first access.
 */
export const useMeetingWorkspaceStore = defineStore('meetingWorkspace', () => {
  const workspaces = reactive<Record<string, MeetingWorkspace>>({})

  function ensureWorkspace(meetingId: string): MeetingWorkspace {
    const existing = workspaces[meetingId]
    if (existing) return existing
    const meeting = getMeetingById(meetingId)
    const created: MeetingWorkspace = {
      agendas: meeting ? structuredClone(meeting.agenda) : [],
      participants: meeting ? structuredClone(meeting.participants) : [],
      seatAssignments: meeting ? structuredClone(meeting.seatAssignments) : {},
      docSections: meeting ? structuredClone(meeting.docSections) : emptyDocSections(),
      legalDraft: meeting?.legalDraft ? structuredClone(meeting.legalDraft) : null,
      draftVersions: meeting?.legalDraft ? buildDraftVersions(meeting.legalDraft) : [],
      selectedDraftVersionId: meeting?.legalDraft ? `${meeting.legalDraft.id}-v${meeting.legalDraft.version_number}` : null,
      comments: [],
      notes: [],
    }
    workspaces[meetingId] = created
    return created
  }

  function getWorkspace(meetingId: string): MeetingWorkspace {
    return ensureWorkspace(meetingId)
  }

  function resolveParticipant(meetingId: string, participant: MeetingParticipant): EnrichedParticipant {
    ensureWorkspace(meetingId)
    const user = getUserById(participant.userId)
    return { ...participant, user, fullName: user ? `${user.firstName} ${user.lastName}` : 'មិនស្គាល់' }
  }

  // ─── Legal draft: versions ──────────────────────────────────────────
  function selectDraftVersion(meetingId: string, versionId: string) {
    const ws = ensureWorkspace(meetingId)
    ws.selectedDraftVersionId = versionId
  }

  // ─── Legal draft: comments & replies ────────────────────────────────
  function addComment(
    meetingId: string,
    payload: { page_number: number; selected_text: string; rects: HighlightRect[]; text: string },
    creator = 'អ្នកចូលរួម',
  ) {
    const ws = ensureWorkspace(meetingId)
    const item: DraftComment = {
      id: `dc-${Date.now()}`,
      page_number: payload.page_number,
      selected_text: payload.selected_text,
      comment: payload.text,
      creator,
      created_at: nowStamp(),
      rects: payload.rects,
      replies: [],
    }
    ws.comments.unshift(item)
    return item.id
  }

  function addReply(meetingId: string, commentId: string, text: string, creator = 'អ្នកចូលរួម') {
    const ws = ensureWorkspace(meetingId)
    const comment = ws.comments.find((c) => c.id === commentId)
    if (!comment) return
    comment.replies.push({ id: `dr-${Date.now()}`, text, creator, created_at: nowStamp() })
  }

  function removeComment(meetingId: string, commentId: string) {
    const ws = ensureWorkspace(meetingId)
    ws.comments = ws.comments.filter((c) => c.id !== commentId)
  }

  // ─── Legal draft: notes ─────────────────────────────────────────────
  function addNote(meetingId: string, text: string, creator = 'អ្នកចូលរួម') {
    const ws = ensureWorkspace(meetingId)
    ws.notes.unshift({ id: `n-${Date.now()}`, note: text, creator, created_at: nowStamp() })
  }

  function removeNote(meetingId: string, noteId: string) {
    const ws = ensureWorkspace(meetingId)
    ws.notes = ws.notes.filter((n) => n.id !== noteId)
  }

  return {
    workspaces,
    getWorkspace,
    resolveParticipant,
    selectDraftVersion,
    addComment,
    addReply,
    removeComment,
    addNote,
    removeNote,
  }
})
