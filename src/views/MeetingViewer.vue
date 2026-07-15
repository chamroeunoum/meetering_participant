<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Calendar, Clock, MapPin, Users } from 'lucide-vue-next'
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
const portalStore = usePortalStore()
const workspace = useMeetingWorkspaceStore()

const meeting = computed(() => getMeetingById('m1'))
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
    <div class="embedded-toolbar">
      <button class="btn btn-secondary" type="button" @click="goBack">ត្រឡប់ទៅផ្ទាំងសេវាកម្ម</button>
      <span>មើលព័ត៌មានកិច្ចប្រជុំ</span>
    </div>
    <main class="page-content" v-if="meeting && ws">
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
        <h2 class="meeting-title">{{ getDisplayMeetingTitle(meeting) }}</h2>
        <div class="meeting-meta-grid">
          <div class="meta-item"><span class="meta-label">ប្រភេទ</span><span class="meta-value">{{ meeting.meetingType }}</span></div>
          <div class="meta-item"><span class="meta-label">អ្នកចូលរួម</span><span class="meta-value">{{ meeting.expectedAttendees }}</span></div>
          <div class="meta-item"><span class="meta-label">លេខកូដ</span><span class="meta-value code">{{ meeting.meetingCode }}</span></div>
          <div class="meta-item"><span class="meta-label">តំណ</span><a :href="meeting.meetingLink" target="_blank" class="meta-value link">{{ meeting.meetingLink }}</a></div>
        </div>
        <button class="room-guide-btn" type="button" @click="goToRoomGuide">
          <MapPin :size="16" :stroke-width="2.5" /> មើលទីតាំងបន្ទប់ប្រជុំ
        </button>
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
                <div class="progress-legend" aria-label="ស្ថានភាពរបៀបវារៈ">
                  <span><i class="legend-dot complete" />បានបញ្ចប់</span>
                  <span><i class="legend-dot pending" />កំពុងរង់ចាំ</span>
                  <span><i class="legend-dot not-yet" />មិនទាន់ដល់</span>
                </div>
              </div>
              <div class="card-body agenda-sessions">
                <section v-for="session in ['morning', 'afternoon']" :key="session" class="session-block">
                  <div class="session-title">{{ session === 'morning' ? 'វគ្គព្រឹក' : 'វគ្គរសៀល' }}</div>
                  <div v-if="!(meeting.agenda || []).filter((i: any) => i.session === session).length" class="empty-state compact">មិនមានធាតុ</div>
                  <div v-else class="agenda-table">
                    <div class="agenda-header-row">
                      <span /><span>ម៉ោង</span><span>ចំណងជើង និងពិពណ៌នា</span>
                    </div>
                    <div
                      v-for="(item, index) in (meeting.agenda || []).filter((i: any) => i.session === session)"
                      :key="item.id"
                      :class="['agenda-row', `progress-${getAgendaProgressStatus(item, index)}`, { last: index === (meeting.agenda || []).filter((i: any) => i.session === session).length - 1 }]"
                    >
                      <div class="agenda-timeline">
                        <div class="timeline-node" />
                        <div v-if="index < (meeting.agenda || []).filter((i: any) => i.session === session).length - 1" class="timeline-line" />
                      </div>
                      <div class="agenda-time-col">
                        <div>{{ getAgendaStart(item) }}</div>
                        <div class="time-end">{{ getAgendaEnd(item) }}</div>
                      </div>
                      <div class="agenda-content-col">
                        <div class="agenda-title">{{ getDisplayAgendaItem(item).title }}</div>
                        <div class="agenda-desc">{{ getDisplayAgendaItem(item).description }}</div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            <!-- Participant/Seating Layout Panel -->
            <div v-if="activeTab === 'participants'" class="card">
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
              <!-- Your participants/seating content goes here -->
              <div class="card-body">
                <!-- Add your seating layout content here -->
              </div>
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
        </section>
      </div>

      <!-- Participants -->
      <div v-if="activeTab === 'participants'" class="panel">
        <div class="p-grid">
          <div v-for="p in getParticipantList()" :key="p.id" class="p-card">
            <span class="p-av">{{ p.avatar || p.firstName?.[0] || '--' }}</span>
            <div class="p-info">
              <strong>{{ getUserName(p) }}</strong>
              <span>{{ p.position || p.title || '-' }}</span>
            </div>
          </div>
          <div v-if="!getParticipantList().length" class="empty-hint">មិនមានអ្នកចូលរួម</div>
        </div>
      </div>

      <!-- Legal documents -->
      <div v-if="activeTab === 'legal'" class="panel">
        <div v-if="legalDocs.length" class="d-list">
          <div v-for="doc in legalDocs" :key="doc.id" class="d-item">
            <span class="d-ico">📄</span>
            <div class="d-info">
              <strong>{{ doc.name }}</strong>
              <span>{{ formatSize(doc.size) || (doc.pageCount ? doc.pageCount + ' ទំព័រ' : '') }}</span>
            </div>
            <button class="d-btn" type="button" @click="openPdfModal(doc)"><ExternalLink :size="14" :stroke-width="2.5" /> មើល</button>
          </div>
        </div>
        <div v-else class="empty-hint">មិនមានឯកសារច្បាប់</div>
      </div>

      <!-- Reference documents (PDF opens in modal) -->
      <div v-if="activeTab === 'references'" class="panel">
        <div v-if="referenceDocs.length" class="d-list">
          <div v-for="doc in referenceDocs" :key="doc.id" class="d-item">
            <span class="d-ico">📄</span>
            <div class="d-info">
              <strong>{{ doc.name }}</strong>
              <span>{{ formatSize(doc.size) }}</span>
            </div>
            <button class="d-btn" type="button" @click="openPdfModal(doc)"><ExternalLink :size="14" :stroke-width="2.5" /> មើល</button>
          </div>
        </div>
        <div v-else class="empty-hint">មិនមានឯកសារយោង</div>
      </div>

      <!-- Meeting history -->
      <div v-if="activeTab === 'history'" class="panel">
        <div class="h-list">
          <div v-for="m in meetingHistory" :key="m.id" class="h-item">
            <div class="h-date">
              <span class="h-d">{{ m.date?.slice(8) }}</span>
              <span class="h-mo">{{ m.date?.slice(0, 7) }}</span>
            </div>
            <div class="h-info">
              <strong>{{ getDisplayMeetingTitle(m) }}</strong>
              <span>{{ formatDate(m.date) }} · {{ formatTimeRange(m.startTime, m.endTime) }} · {{ getDisplayVenue(m) }}</span>
              <span class="h-badge">{{ displayMeetingStatus(m.status) }}</span>
            </div>
          </div>
          <div v-if="!meetingHistory.length" class="empty-hint">មិនមានប្រវត្តិ</div>
        </div>
      </div>
    </template>
    <div v-else class="empty-hint" style="padding: 60px; text-align: center;">រកមិនឃើញកិច្ចប្រជុំ</div>
  </div>

  <!-- PDF Modal -->
  <Teleport to="body">
    <div v-if="showPdfModal && pdfModalDoc" class="pdf-overlay" @click.self="closePdfModal">
      <div class="pdf-modal">
        <div class="pdf-modal-header">
          <strong class="pdf-modal-title">{{ pdfModalDoc.name }}</strong>
          <button class="pdf-modal-close" type="button" @click="closePdfModal">✕</button>
        </div>
        <iframe class="pdf-modal-frame" :src="pdfModalDoc.url" title="PDF" />
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.meeting-detail {
  display: grid;
  gap: 20px;
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
