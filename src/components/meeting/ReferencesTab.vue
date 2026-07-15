<script setup lang="ts">
import { computed, ref } from 'vue'
import { FileText } from 'lucide-vue-next'
import VuePdfEmbed from 'vue-pdf-embed'
import { useMeetingWorkspaceStore } from '@/stores/meetingWorkspace'
import type { DocSections, Meeting } from '@/utils/data'

const props = defineProps<{ meeting: Meeting }>()

const workspace = useMeetingWorkspaceStore()
const ws = computed(() => workspace.getWorkspace(props.meeting.id))

const sections: { key: keyof DocSections; label: string }[] = [
  { key: 'ministerPreeng', label: 'ឯកសារពីរដ្ឋមន្ត្រី' },
  { key: 'seichdeyPreeng', label: 'សេចក្តីព្រាងសម្រាប់ពិភាក្សា' },
  { key: 'techReports', label: 'របាយការណ៍បច្ចេកទេស' },
  { key: 'reports', label: 'របាយការណ៍' },
  { key: 'otherDocuments', label: 'ឯកសារផ្សេងៗ' },
]

const activeKey = ref<keyof DocSections | null>(null)
const activeIdx = ref<number | null>(null)

const activeDoc = computed(() => {
  if (!activeKey.value || activeIdx.value === null) return null
  return ws.value.docSections[activeKey.value][activeIdx.value] ?? null
})

function selectDoc(key: keyof DocSections, idx: number) {
  activeKey.value = key
  activeIdx.value = idx
}
</script>

<template>
  <div class="references-tab">
    <div class="doc-sidebar">
      <div v-for="section in sections" :key="section.key" class="doc-section">
        <div class="doc-section-header">
          <span class="doc-section-title">{{ section.label }} ({{ ws.docSections[section.key].length }})</span>
        </div>
        <div v-if="ws.docSections[section.key].length === 0" class="doc-empty">មិនទាន់មានឯកសារ</div>
        <button
          v-for="(f, i) in ws.docSections[section.key]"
          :key="f.id"
          type="button"
          class="doc-row"
          :class="{ active: activeKey === section.key && activeIdx === i }"
          @click="selectDoc(section.key, i)"
        >
          <FileText :size="14" :stroke-width="2.2" class="doc-row-icon" />
          <span class="doc-row-name">{{ f.name }}</span>
        </button>
      </div>
    </div>

    <div class="doc-viewer">
      <VuePdfEmbed v-if="activeDoc" :key="activeDoc.id" :source="activeDoc.url" class="doc-pdf" />
      <div v-else class="doc-viewer-empty">
        <FileText :size="48" :stroke-width="1.6" />
        <span>ជ្រើសរើសឯកសារនៅខាងឆ្វេងដើម្បីមើល</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.references-tab {
  display: flex;
  height: 720px;
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.doc-sidebar {
  width: 280px;
  flex: none;
  overflow-y: auto;
  border-right: 1px solid var(--color-border-soft);
}

.doc-section {
  border-bottom: 1px solid var(--color-border-soft);
}

.doc-section-header {
  position: sticky;
  top: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: var(--color-bg);
}

.doc-section-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-text);
}

.doc-empty {
  padding: 10px 12px;
  font-size: 12px;
  color: var(--color-text-secondary);
  text-align: center;
}

.doc-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  text-align: left;
  background: transparent;
  border: none;
  border-left: 2px solid transparent;
}

.doc-row:hover {
  background: var(--color-bg);
}

.doc-row.active {
  background: #e6f0fd;
  border-left-color: var(--color-primary);
}

.doc-row-icon {
  flex: none;
  color: var(--color-text-secondary);
}

.doc-row-name {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.doc-viewer {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  background: #f3f4f6;
}

.doc-pdf {
  width: 100%;
}

.doc-viewer-empty {
  display: flex;
  height: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--color-text-secondary);
  font-size: 14px;
}
</style>
