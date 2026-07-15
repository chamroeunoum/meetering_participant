<script setup lang="ts">
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import DraftPdfSection from '@/components/DraftPdfSection.vue'
import { useMeetingWorkspaceStore } from '@/stores/meetingWorkspace'
import { getMeetingById } from '@/utils/data'

const route = useRoute()
const workspace = useMeetingWorkspaceStore()

const meetingId = computed(() => String(route.params.meeting_id || route.query.meeting_id || ''))
const draftId = computed(() => String(route.params.draft_id || ''))
const meeting = computed(() => getMeetingById(meetingId.value))
const ws = computed(() => workspace.getWorkspace(meetingId.value))

// Jumping in from the timeline with a specific version id selects that version
// so DraftPdfSection's own history-tab state (activeVersion/pdfSource) reflects it.
watch(
  () => [meetingId.value, draftId.value] as const,
  () => {
    if (draftId.value && ws.value.draftVersions.some((v) => v.id === draftId.value)) {
      workspace.selectDraftVersion(meetingId.value, draftId.value)
    }
  },
  { immediate: true },
)

// Comments stay open unless the meeting already happened and is over.
const meetingEditable = computed(() => {
  if (!meeting.value) return true
  if (meeting.value.status === 'completed' || meeting.value.status === 'cancelled') return false
  const d = new Date(`${meeting.value.date}T00:00:00`)
  if (Number.isNaN(d.getTime())) return true
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return d >= today
})
</script>

<template>
  <div class="draft-viewer-page">
    <DraftPdfSection
      v-if="meeting && ws.legalDraft"
      mode="page"
      :pdf-url="ws.legalDraft.pdf_url"
      :docx-url="ws.legalDraft.docx_url"
      :editable="meetingEditable"
      :title="ws.legalDraft.title"
      :version="ws.legalDraft.version_number"
      :status="ws.legalDraft.status"
      :regulator="ws.legalDraft.regulator"
      :meeting-id="meeting.id"
      :start-with-sidebar="true"
    />
    <div v-else class="draft-viewer-empty">រកមិនឃើញសេចក្តីព្រាងច្បាប់សម្រាប់កិច្ចប្រជុំនេះទេ</div>
  </div>
</template>

<style scoped>
.draft-viewer-page {
  height: 100vh;
}

.draft-viewer-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--color-text-secondary);
  font-size: 15px;
}
</style>
