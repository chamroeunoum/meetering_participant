<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Calendar, Clock, FileText, MapPin, Users } from 'lucide-vue-next'
import { usePortalStore } from '@/stores/portal'
import { useMeetingWorkspaceStore } from '@/stores/meetingWorkspace'
import {
  formatDate,
  formatTimeRange,
  getMeetingById,
  getMeetingOrganizations,
  getMeetingRooms,
  getStatusBadge,
} from '@/utils/data'
import AgendaTab from '@/components/meeting/AgendaTab.vue'
import MemberListTab from '@/components/meeting/MemberListTab.vue'
import ReferencesTab from '@/components/meeting/ReferencesTab.vue'
import DraftTab from '@/components/meeting/DraftTab.vue'
import DraftHistoryTab from '@/components/meeting/DraftHistoryTab.vue'

const router = useRouter()
const route = useRoute()
const portalStore = usePortalStore()
const workspace = useMeetingWorkspaceStore()

const meeting = computed(() => getMeetingById('m1'))
const isFromCalendar = computed(() => route.query.from === 'calendar')
const ws = computed(() => (meeting.value ? workspace.getWorkspace(meeting.value.id) : null))

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'បានកំណត់ពេល',
  completed: 'បានបញ្ចប់',
  pending: 'កំពុងរង់ចាំ',
  cancelled: 'បានលុបចោល',
}
function displayMeetingStatus(status: string) {
  return STATUS_LABELS[status] || status
}

const displayOrganizations = computed(() => (meeting.value ? getMeetingOrganizations(meeting.value) : []))
const displayRooms = computed(() => (meeting.value ? getMeetingRooms(meeting.value) : []))

const meetingLeaders = computed(() => {
  if (!ws.value || !meeting.value) return []
  return ws.value.participants
    .filter((p) => p.group === 'lead_meeting' && p.role === 'leader')
    .map((p) => workspace.resolveParticipant(meeting.value!.id, p))
})

const tabs = [
  { key: 'agenda', label: 'របៀបវារៈ' },
  { key: 'members', label: 'បញ្ជីសមាសភាព' },
  { key: 'references', label: 'ឯកសារយោង' },
  { key: 'draft', label: 'សេចក្តីព្រាងច្បាប់' },
  { key: 'history', label: 'ប្រវត្តិកំណែ' },
] as const

type TabKey = (typeof tabs)[number]['key']
const activeTab = ref<TabKey>('agenda')

const pdfModalDoc = ref<any>(null)
const showPdfModal = ref(false)
function openPdfModal(doc: any) {
  pdfModalDoc.value = doc
  showPdfModal.value = true
}
function closePdfModal() {
  showPdfModal.value = false
  pdfModalDoc.value = null
}

function getAgendaStart(item: any) {
  return item.startTime || item.time
}

function getAgendaEnd(item: any) {
  return item.endTime || '-'
}

function goBack() {
  if (isFromCalendar.value) {
    router.push('/viewer-calendar')
  } else {
    portalStore.clearActivePortal()
    router.push('/portal')
  }
}
</script>

<template>
  <div class="embedded-portal">
    <header class="service-header">
      <button class="back-btn" type="button" @click="goBack">
        <ArrowLeft :size="20" :stroke-width="2.5" /> ត្រឡប់
      </button>
      <div class="header-center">
        <div class="header-icon"><FileText :size="22" :stroke-width="2" /></div>
        <h1 class="header-title">មើលព័ត៌មានកិច្ចប្រជុំ</h1>
      </div>
    </header>
    <div class="page-content">
      <div class="meeting-detail">
        <div class="detail-header card">
          <div class="card-body">
            <div class="header-top">
              <div>
                <div class="page-eyebrow">ព័ត៌មានលម្អិតកិច្ចប្រជុំ</div>
                <h1 class="page-title detail-title">{{ meeting.objective || meeting.title }}</h1>
                <div class="header-meta">
                  <span :class="['badge', getStatusBadge(meeting.status)]">{{ displayMeetingStatus(meeting.status) }}</span>
                  <span><Calendar :size="14" :stroke-width="2.4" />{{ formatDate(meeting.date) }}</span>
                  <span><Clock :size="14" :stroke-width="2.4" />{{ formatTimeRange(meeting.startTime, meeting.endTime) }}</span>
                  <span><MapPin :size="14" :stroke-width="2.4" />{{ displayRooms.map((r) => r.name).join(', ') || 'មិនទាន់កំណត់' }}</span>
                </div>
              </div>
            </div>
            <div class="header-info grid-4">
              <div class="info-item"><span class="info-label">ប្រភេទកិច្ចប្រជុំ</span><span class="info-value">{{ meeting.type?.name || meeting.category }}</span></div>
              <div class="info-item"><span class="info-label">អង្គភាពពាក់ព័ន្ធ</span><span class="info-value">{{ displayOrganizations.join(', ') || 'មិនទាន់កំណត់' }}</span></div>
              <div class="info-item"><span class="info-label">លេខកូដកិច្ចប្រជុំ</span><span class="info-value code">{{ meeting.meetingCode }}</span></div>
              <div class="info-item compact-link-item"><span class="info-label">តំណកិច្ចប្រជុំ</span><a :href="meeting.meetingLink" target="_blank" rel="noreferrer" class="info-value link">{{ meeting.meetingLink }}</a></div>
            </div>
            <div v-if="meeting.route" class="header-route">
              <MapPin :size="16" :stroke-width="2.2" class="header-route-icon" />
              <div>
                <div class="header-route-label">ផ្លូវទៅកាន់បន្ទប់ប្រជុំ</div>
                <p>{{ meeting.route }}</p>
              </div>
            </div>
            <div v-if="meetingLeaders.length > 0" class="header-leaders">
              <Users :size="15" :stroke-width="2.2" />
              <span>អ្នកដឹកនាំកិច្ចប្រជុំ៖ {{ meetingLeaders.map((l) => l.fullName).join(', ') }}</span>
            </div>
          </div>
        </div>

      </div>

        <div class="agenda-layout">
          <div class="agenda-main">
            <div class="card">
              <div class="card-header">
                <div class="agenda-title-bar">
                  <div class="agenda-title-tabs" role="tablist" aria-label="ព័ត៌មានកិច្ចប្រជុំ">
                    <button
                      v-for="tab in tabs"
                      :key="tab.key"
                      :class="['tab', 'agenda-title-tab', { active: activeTab === tab.key }]"
                      type="button"
                      role="tab"
                      :aria-selected="activeTab === tab.key"
                      @click="activeTab = tab.key"
                    >
                      {{ tab.label }}
                    </button>
                  </div>
                </div>
              </div>
              <div class="card-body">
                <AgendaTab v-if="activeTab === 'agenda'" :meeting="meeting" />
                <MemberListTab v-else-if="activeTab === 'members'" :meeting="meeting" />
                <ReferencesTab v-else-if="activeTab === 'references'" :meeting="meeting" />
                <DraftTab v-else-if="activeTab === 'draft'" :meeting="meeting" />
                <DraftHistoryTab v-else-if="activeTab === 'history'" :meeting="meeting" />
              </div>
            </div>
          </div>
        </div>

    </div>
  </div>

  <!-- PDF Modal -->
  <Teleport to="body">
    <div v-if="showPdfModal && pdfModalDoc" class="pdf-overlay" @click.self="closePdfModal">
      <div class="pdf-modal">
        <div class="pdf-modal-header">
          <strong class="pdf-modal-title">{{ pdfModalDoc.name }}</strong>
          <button class="pdf-modal-close" type="button" @click="closePdfModal">✕</button>
        </div>
        <iframe class="pdf-modal-frame" :src="pdfModalDoc.url" title="PDF"></iframe>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.service-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 20px 24px 16px; border-bottom: 1px solid var(--color-border-soft); }
.back-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; font-size: 14px; font-weight: 600; color: var(--color-primary); background: rgba(255,255,255,0.8); border: 1px solid var(--color-border); border-radius: 10px; cursor: pointer; transition: all var(--transition); }
.back-btn:hover { background: #fff; border-color: var(--color-primary); }
.header-center { display: flex; align-items: center; gap: 10px; }
.header-icon { display: grid; place-items: center; width: 40px; height: 40px; color: var(--color-primary); background: rgba(13,98,213,0.08); border-radius: 10px; }
.header-title { margin: 0; font-family: var(--font-heading); font-size: 20px; font-weight: 700; color: var(--color-text); }
.embedded-portal { flex: 1; width: 100%; }
.page-content { width: 100%; }
.meeting-detail {
  display: grid;
  gap: 20px;
  margin-bottom: 24px;
}

.header-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.header-top .btn svg {
  margin-right: 6px;
}

.detail-title {
  margin: 4px 0 10px;
  font-family: var(--font-heading);
  font-size: 22px;
  font-weight: 400;
  color: var(--color-text);
}

.header-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
  font-size: 14px;
  color: var(--color-text-secondary);
}

.header-meta span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.badge {
  padding: 3px 12px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 999px;
}

.badge-info {
  color: var(--color-primary-hover);
  background: #e6f0fd;
}

.badge-success {
  color: #1c7a44;
  background: #e7f8ee;
}

.badge-warning {
  color: #92660a;
  background: #fdf3d8;
}

.badge-danger {
  color: var(--color-danger);
  background: var(--color-danger-light);
}

.badge-neutral {
  color: var(--color-text-secondary);
  background: var(--color-bg);
}

.header-info {
  padding-top: 16px;
  margin-top: 16px;
  border-top: 1px solid var(--color-border-soft);
}

.grid-4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

@media (max-width: 900px) {
  .grid-4 {
    grid-template-columns: repeat(2, 1fr);
  }
}

.info-item {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.info-label {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.info-value {
  font-size: 14px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.info-value.code {
  font-family: monospace;
  letter-spacing: 0.03em;
}

.info-value.link {
  color: var(--color-primary);
  text-decoration: underline;
}

.header-route {
  display: flex;
  gap: 10px;
  padding: 12px 14px;
  margin-top: 16px;
  background: #e7f8ee;
  border: 1px solid #bfe8cf;
  border-radius: var(--radius-sm);
}

.header-route-icon {
  flex: none;
  color: #1c7a44;
  margin-top: 2px;
}

.header-route-label {
  font-size: 12px;
  font-weight: 700;
  color: #1c7a44;
  margin-bottom: 2px;
}

.header-route p {
  margin: 0;
  font-size: 13px;
  color: var(--color-text);
  line-height: 1.6;
}

.header-leaders {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 14px;
  margin-top: 14px;
  font-size: 13px;
  color: var(--color-text-secondary);
  border-top: 1px solid var(--color-border-soft);
}

.agenda-title-bar {
  display: flex;
  align-items: center;
}

.agenda-title-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tab.agenda-title-tab {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-secondary);
  background: transparent;
  border: 1px solid transparent;
  border-radius: 999px;
}

.tab.agenda-title-tab:hover {
  color: var(--color-primary);
}

.tab.agenda-title-tab.active {
  color: #fff;
  background: var(--color-primary);
}
</style>
