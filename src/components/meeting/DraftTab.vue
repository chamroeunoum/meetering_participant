<script setup lang="ts">
import { computed } from 'vue'
import DraftPdfSection from '../DraftPdfSection.vue'
import type { Meeting } from '@/utils/data'

const props = defineProps<{ meeting: Meeting }>()

// Comments stay open until the meeting is over.
const canComment = computed(() => props.meeting.status !== 'completed' && props.meeting.status !== 'cancelled')
</script>

<template>
  <div class="draft-tab">
    <div v-if="!meeting.legalDraft" class="empty-state">មិនទាន់មានសេចក្តីព្រាងច្បាប់ទេ</div>
    <DraftPdfSection
      v-else
      mode="embedded"
      :pdf-url="meeting.legalDraft.pdf_url"
      :docx-url="meeting.legalDraft.docx_url"
      :editable="canComment"
      :title="meeting.legalDraft.title"
      :version="meeting.legalDraft.version_number"
      :status="meeting.legalDraft.status"
      :regulator="meeting.legalDraft.regulator"
      :meeting-id="meeting.id"
      :start-with-sidebar="true"
    />
  </div>
</template>

<style scoped>
.draft-tab {
  display: grid;
  gap: 12px;
  min-width: 0;
}
</style>
