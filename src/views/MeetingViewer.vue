<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePortalStore } from '@/stores/portal'
import { getMeetingById, getMeetings, formatDate, formatTimeRange, getUserById, getUserName } from '@/utils/data'
import { ArrowLeft, FileText, MapPin, Users, Scale, FileSearch, History, ExternalLink } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const portalStore = usePortalStore()

const activeTab = ref<'agenda' | 'participants' | 'legal' | 'references' | 'history'>('agenda')
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

const meetingId = computed(() => (route.query.id as string) || 'm1')
const meeting = computed(() => getMeetingById(meetingId.value))
const allMeetings = computed(() => getMeetings())

const legalDocs = computed(() =>
  (meeting.value?.documents || []).filter((d: any) => d.category === 'Supporting')
)
const referenceDocs = computed(() =>
  (meeting.value?.documents || []).filter((d: any) => d.category === 'Reference')
)
const meetingHistory = computed(() =>
  allMeetings.value.filter((m: any) => m.id !== meeting.value?.id).slice(0, 5)
)

function getDisplayMeetingTitle(m: any) {
  const t: Record<string, string> = {
    m1: 'ការពិនិត្យការផ្លាស់ប្តូរឌីជីថល ត្រីមាសទី៤ ឆ្នាំ២០២៦',
    m2: 'កិច្ចប្រជុំផែនការគម្រោងឌីជីថល',
    m3: 'កិច្ចប្រជុំគណៈកម្មការត្រួតពិនិត្យ',
  }
  return t[m.id] || m.title
}

function getDisplayVenue(m: any) {
  const v: Record<string, string> = {
    'Executive Boardroom': 'បន្ទប់ប្រជុំប្រតិបត្តិ',
    'Innovation Lab': 'មន្ទីរច្នៃប្រឌិត',
    'Conference Room C': 'បន្ទប់ប្រជុំ C',
    'Training Hall': 'សាលាបណ្តុះបណ្តាល',
    'Grand Conference Hall': 'សាលសន្និសីទធំ',
  }
  return v[m.venue] || m.venue
}

function displayMeetingStatus(status: string) {
  const l: Record<string, string> = {
    scheduled: 'បានកំណត់ពេល', completed: 'បានបញ្ចប់',
    pending: 'កំពុងរង់ចាំ', cancelled: 'បានលុបចោល',
  }
  return l[status] || status
}

function getAgendaItemDisplay(item: any) {
  const items: Record<string, { title: string; description: string }> = {
    a1: { title: 'មតិស្វាគមន៍', description: 'ស្វាគមន៍ និងគោលបំណង' },
    a2: { title: 'ពិនិត្យលទ្ធផលត្រីមាសទី១', description: 'ពិនិត្យ KPI និងសូចនាករត្រីមាសទី១' },
    a3: { title: 'វិភាគទីផ្សារ', description: 'បច្ចុប្បន្នភាពអំពីការប្រកួតប្រជែង' },
    a4: { title: 'សម្រាកអាហារថ្ងៃត្រង់', description: 'អាហារថ្ងៃត្រង់ និងបង្កើនទំនាក់ទំនង' },
    a5: { title: 'ការងារត្រូវធ្វើ និងជំហានបន្ទាប់', description: 'កំណត់ការងារត្រូវធ្វើ និងអ្នកទទួលខុសត្រូវ' },
  }
  return items[item.id] || { title: item.title, description: item.description }
}

function getAgendaStatus(item: any, index: number) {
  const s: Record<string, string> = { a1: 'complete', a2: 'complete', a3: 'pending', a4: 'not-yet', a5: 'not-yet' }
  return s[item.id] || (index === 0 ? 'pending' : 'not-yet')
}

function getParticipantList() {
  return (meeting.value?.attendeeIds || []).map((uid: string) => getUserById(uid)).filter(Boolean)
}

function formatSize(bytes: number) {
  if (!bytes) return ''
  const kb = bytes / 1024
  return kb < 1024 ? `${kb.toFixed(0)} KB` : `${(kb / 1024).toFixed(1)} MB`
}

const from = computed(() => route.query.from as string)
const isFromCalendar = computed(() => from.value === 'calendar')

const venueToRoom: Record<string, string> = {
  'Grand Conference Hall': 'room-a',
  'Executive Boardroom': 'room-a',
  'Innovation Lab': 'room-b',
  'Conference Room C': 'room-c',
  'Training Hall': 'room-b',
}

function goToRoomGuide() {
  const venue = meeting.value?.venue
  const roomId = venue ? venueToRoom[venue] || '' : ''
  portalStore.setActivePortal('guide')
  router.push(`/guide?room=${roomId}&meetingId=${meeting.value?.id}&from=meeting-viewer`)
}

function goBack() {
  if (isFromCalendar.value) {
    router.push('/viewer-calendar')
  } else {
    portalStore.clearActivePortal()
    router.push('/portal')
  }
}

const tabs = [
  { id: 'agenda' as const, label: 'របៀបវារៈ', icon: FileText },
  { id: 'participants' as const, label: 'អ្នកចូលរួម', icon: Users },
  { id: 'legal' as const, label: 'ឯកសារច្បាប់', icon: Scale },
  { id: 'references' as const, label: 'ឯកសារយោង', icon: FileSearch },
  { id: 'history' as const, label: 'ប្រវត្តិកិច្ចប្រជុំ', icon: History },
]
</script>

<template>
  <div class="service-page">
    <header class="service-header">
      <button class="back-btn" type="button" @click="goBack">
        <ArrowLeft :size="20" :stroke-width="2.5" /> {{ isFromCalendar ? 'ត្រឡប់ទៅប្រតិទិន' : 'ត្រឡប់' }}
      </button>
      <div class="header-center">
        <div class="header-icon"><FileText :size="22" :stroke-width="2" /></div>
        <h1 class="header-title">មើលព័ត៌មានកិច្ចប្រជុំ</h1>
      </div>
    </header>

    <template v-if="meeting">
      <!-- Meeting info card -->
      <div class="meeting-card">
        <div class="meeting-card-top">
          <div class="meeting-badge">{{ displayMeetingStatus(meeting.status) }}</div>
          <span class="meta-chips">{{ formatDate(meeting.date) }}</span>
          <span class="meta-chips">{{ formatTimeRange(meeting.startTime, meeting.endTime) }}</span>
          <span class="meta-chips">{{ getDisplayVenue(meeting) }}</span>
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

      <!-- Tab bar -->
      <div class="tab-bar">
        <button v-for="tab in tabs" :key="tab.id" :class="['tab-btn', { active: activeTab === tab.id }]" type="button" @click="activeTab = tab.id">
          <component :is="tab.icon" :size="15" :stroke-width="2.5" />
          {{ tab.label }}
        </button>
      </div>

      <!-- Agenda -->
      <div v-if="activeTab === 'agenda'" class="panel">
        <div class="prog-legend">
          <span><i class="pdot done" />បានបញ្ចប់</span>
          <span><i class="pdot wait" />កំពុងរង់ចាំ</span>
          <span><i class="pdot none" />មិនទាន់ដល់</span>
        </div>
        <section v-for="s in ['morning', 'afternoon']" :key="s" class="sess">
          <h3 class="sess-title">{{ s === 'morning' ? 'វគ្គព្រឹក' : 'វគ្គរសៀល' }}</h3>
          <div v-if="!(meeting.agenda || []).filter((i: any) => i.session === s).length" class="empty-hint">មិនមានធាតុ</div>
          <div v-else class="a-table">
            <div v-for="(item, idx) in (meeting.agenda || []).filter((i: any) => i.session === s)" :key="item.id" :class="['a-row', `s-${getAgendaStatus(item, idx)}`]">
              <div class="a-tl">
                <div :class="['a-node', getAgendaStatus(item, idx)]" />
                <div v-if="idx < (meeting.agenda || []).filter((i: any) => i.session === s).length - 1" class="a-line" />
              </div>
              <div class="a-body">
                <div class="a-time">{{ item.startTime || item.time }} - {{ item.endTime || '-' }}</div>
                <div class="a-ttl">{{ getAgendaItemDisplay(item).title }}</div>
                <div class="a-desc">{{ getAgendaItemDisplay(item).description }}</div>
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

.service-page { max-width: 1000px; margin: 0 auto; padding: 8px 24px 48px; }

.service-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 24px 0 20px; border-bottom: 1px solid var(--color-border-soft); margin-bottom: 24px; }
.back-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; font-size: 14px; font-weight: 600; color: var(--color-primary); background: rgba(255,255,255,0.8); border: 1px solid var(--color-border); border-radius: 10px; cursor: pointer; transition: all var(--transition); }
.back-btn:hover { background: #fff; border-color: var(--color-primary); }
.header-center { display: flex; align-items: center; gap: 10px; }
.header-icon { display: grid; place-items: center; width: 40px; height: 40px; color: var(--color-primary); background: rgba(13,98,213,0.08); border-radius: 10px; }
.header-title { margin: 0; font-family: var(--font-heading); font-size: 20px; font-weight: 700; color: var(--color-text); }

.meeting-card { background: rgba(255,255,255,0.8); backdrop-filter: blur(8px); border: 1px solid var(--color-border-soft); border-radius: 18px; padding: 24px; margin-bottom: 20px; box-shadow: var(--shadow-sm); }
.meeting-card-top { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 14px; margin-bottom: 12px; }
.meeting-badge { padding: 3px 10px; font-size: 12px; font-weight: 700; border-radius: 6px; background: rgba(13,98,213,0.08); color: var(--color-primary); }
.meta-chips { font-size: 13px; color: var(--color-text-secondary); }
.meeting-title { margin: 0 0 16px; font-family: var(--font-heading); font-size: 22px; font-weight: 700; color: var(--color-text); line-height: 1.3; }
.meeting-meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; padding-top: 16px; border-top: 1px solid var(--color-border-soft); }
.meta-item { display: grid; gap: 2px; }
.meta-label { font-size: 12px; font-weight: 600; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
.meta-value { font-size: 14px; font-weight: 600; color: var(--color-text); }
.meta-value.code { font-family: monospace; letter-spacing: 1px; }
.meta-value.link { color: var(--color-primary); font-size: 13px; word-break: break-all; }

.room-guide-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 16px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 700;
  color: var(--color-primary);
  background: rgba(13,98,213,0.06);
  border: 1px solid rgba(13,98,213,0.2);
  border-radius: 10px;
  cursor: pointer;
  transition: all var(--transition);
}
.room-guide-btn:hover {
  background: rgba(13,98,213,0.12);
  border-color: var(--color-primary);
}

.tab-bar { display: flex; gap: 4px; margin-bottom: 20px; background: rgba(255,255,255,0.6); border-radius: 12px; padding: 4px; border: 1px solid var(--color-border-soft); overflow-x: auto; }
.tab-btn { flex: 0 0 auto; display: flex; align-items: center; gap: 5px; padding: 9px 13px; font-size: 13px; font-weight: 700; color: var(--color-text-secondary); background: transparent; border: none; border-radius: 10px; cursor: pointer; transition: all var(--transition); white-space: nowrap; }
.tab-btn.active { color: #fff; background: var(--color-primary); }
.tab-btn:not(.active):hover { color: var(--color-text); background: rgba(255,255,255,0.8); }

.panel { background: rgba(255,255,255,0.8); backdrop-filter: blur(8px); border: 1px solid var(--color-border-soft); border-radius: 18px; padding: 24px; box-shadow: var(--shadow-sm); }

/* Agenda */
.prog-legend { display: flex; gap: 16px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 1px solid var(--color-border-soft); font-size: 13px; color: var(--color-text-secondary); }
.pdot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; }
.pdot.done { background: #22C55E; }
.pdot.wait { background: #F59E0B; }
.pdot.none { background: #CBD5E1; }
.sess { margin-bottom: 24px; }
.sess-title { margin: 0 0 12px; font-family: var(--font-heading); font-size: 17px; font-weight: 400; color: var(--color-text); }
.empty-hint { padding: 16px; text-align: center; color: var(--color-text-secondary); font-size: 14px; }
.a-table { display: grid; }
.a-row { display: flex; gap: 16px; padding: 12px 0; border-bottom: 1px solid var(--color-border-soft); }
.a-row:last-child { border-bottom: none; padding-bottom: 0; }
.a-tl { display: flex; flex-direction: column; align-items: center; width: 16px; flex-shrink: 0; }
.a-node { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
.a-node.done { background: #22C55E; }
.a-node.wait { background: #F59E0B; }
.a-node.none { background: #CBD5E1; }
.a-line { width: 2px; flex: 1; background: var(--color-border); min-height: 20px; }
.a-body { flex: 1; min-width: 0; }
.a-time { font-size: 12px; font-weight: 600; color: var(--color-text-secondary); margin-bottom: 2px; }
.a-ttl { font-size: 15px; font-weight: 700; color: var(--color-text); margin-bottom: 2px; }
.a-desc { font-size: 13px; color: var(--color-text-secondary); line-height: 1.5; }
.a-row.s-done .a-ttl { opacity: 0.6; }

/* Participants */
.p-grid { display: grid; gap: 10px; }
.p-card { display: flex; align-items: center; gap: 14px; padding: 12px 16px; background: rgba(255,255,255,0.6); border: 1px solid var(--color-border-soft); border-radius: 12px; }
.p-av { display: grid; place-items: center; width: 40px; height: 40px; border-radius: 50%; background: rgba(13,98,213,0.08); color: var(--color-primary); font-size: 14px; font-weight: 700; flex-shrink: 0; }
.p-info { display: grid; gap: 1px; }
.p-info strong { font-size: 15px; font-weight: 700; color: var(--color-text); }
.p-info span { font-size: 13px; color: var(--color-text-secondary); }

/* Doc list (legal) */
.d-list { display: grid; gap: 10px; }
.d-item { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: rgba(255,255,255,0.6); border: 1px solid var(--color-border-soft); border-radius: 12px; }
.d-ico { font-size: 20px; flex-shrink: 0; }
.d-info { flex: 1; min-width: 0; display: grid; gap: 2px; }
.d-info strong { font-size: 14px; font-weight: 700; color: var(--color-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.d-info span { font-size: 12px; color: var(--color-text-secondary); }
.d-btn { display: inline-flex; align-items: center; gap: 4px; padding: 6px 12px; font-size: 12px; font-weight: 600; color: var(--color-primary); background: rgba(13,98,213,0.06); border-radius: 8px; text-decoration: none; transition: background var(--transition); }
.d-btn:hover { background: rgba(13,98,213,0.12); }

/* PDF Modal */
.pdf-modal {
  height: 90vh;
  background: #fff;
  border-radius: 16px;
  display: grid;
  grid-template-rows: auto 1fr;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
}
.pdf-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--color-border);
}
.pdf-modal-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pdf-modal-close {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  border: none;
  border-radius: 50%;
  background: var(--color-bg);
  color: var(--color-text-secondary);
  font-size: 16px;
  cursor: pointer;
  flex-shrink: 0;
}
.pdf-modal-close:hover { background: var(--color-border); }
.pdf-modal-frame {
  width: 100%;
  height: 100%;
  border: none;
  background: #fafafa;
}

@media (max-width: 800px) {
}
@media (max-width: 640px) {
  .service-page { padding: 8px 16px 48px; }
  .service-header { flex-direction: column; align-items: flex-start; }
  .header-title { font-size: 18px; }
  .h-title { font-size: 17px; }
  .meeting-title { font-size: 18px; }
  .service-header { flex-wrap: wrap; gap: 8px; }
  .meeting-title { font-size: 19px; }
  .meeting-meta-grid { grid-template-columns: 1fr; }
  .tab-bar { gap: 2px; padding: 3px; }
  .tab-btn { padding: 7px 10px; font-size: 12px; gap: 4px; }
  .tab-btn svg { display: none; }
  .prog-legend { flex-wrap: wrap; gap: 8px; }
  .d-item { flex-wrap: wrap; gap: 8px; }
  .d-btn { width: 100%; justify-content: center; }
}
</style>
