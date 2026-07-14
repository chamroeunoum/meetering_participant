<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePortalStore } from '@/stores/portal'
import { getMeetingById, formatDate, formatTimeRange, getStatusBadge } from '@/utils/data'

const route = useRoute()
const router = useRouter()
const portalStore = usePortalStore()

const activePanel = ref('agenda')
const selectedDocument = ref(null)

const meeting = computed(() => getMeetingById('m1'))

function getDisplayMeetingTitle(meeting: any) {
  const titles: Record<string, string> = {
    m1: 'ការពិនិត្យការផ្លាស់ប្តូរឌីជីថល ត្រីមាសទី៤ ឆ្នាំ២០២៦',
  }
  return titles[meeting.id] || meeting.title
}

function getDisplayVenue(meeting: any) {
  const venues: Record<string, string> = {
    'Executive Boardroom': 'បន្ទប់ប្រជុំប្រតិបត្តិ',
    'Innovation Lab': 'មន្ទីរច្នៃប្រឌិត',
    'Conference Room C': 'បន្ទប់ប្រជុំ C',
    'Training Hall': 'សាលាបណ្តុះបណ្តាល',
    'Grand Conference Hall': 'សាលសន្និសីទធំ',
  }
  return venues[meeting.venue] || meeting.venue
}

function displayMeetingStatus(status: string) {
  const labels: Record<string, string> = {
    scheduled: 'បានកំណត់ពេល',
    completed: 'បានបញ្ចប់',
    pending: 'កំពុងរង់ចាំ',
    cancelled: 'បានលុបចោល',
  }
  return labels[status] || status
}

function getDisplayAgendaItem(item: any) {
  const items: Record<string, { title: string; description: string }> = {
    a1: { title: 'មតិស្វាគមន៍', description: 'ស្វាគមន៍ និងគោលបំណង' },
    a2: { title: 'ពិនិត្យលទ្ធផលត្រីមាសទី១', description: 'ពិនិត្យ KPI និងសូចនាករត្រីមាសទី១' },
    a3: { title: 'វិភាគទីផ្សារ', description: 'បច្ចុប្បន្នភាពអំពីការប្រកួតប្រជែង' },
    a4: { title: 'សម្រាកអាហារថ្ងៃត្រង់', description: 'អាហារថ្ងៃត្រង់ និងបង្កើនទំនាក់ទំនង' },
    a5: { title: 'ការងារត្រូវធ្វើ និងជំហានបន្ទាប់', description: 'កំណត់ការងារត្រូវធ្វើ និងអ្នកទទួលខុសត្រូវ' },
  }
  return items[item.id] || { title: item.title, description: item.description }
}

function getAgendaProgressStatus(item: any, index: number) {
  const explicit: Record<string, string> = {
    a1: 'complete',
    a2: 'complete',
    a3: 'pending',
    a4: 'not-yet',
    a5: 'not-yet',
  }
  return explicit[item.id] || (index === 0 ? 'pending' : 'not-yet')
}

function getAgendaStart(item: any) {
  return item.startTime || item.time
}

function getAgendaEnd(item: any) {
  return item.endTime || '-'
}

function goBack() {
  portalStore.clearActivePortal()
  router.push('/')
}

function showAgenda() {
  activePanel.value = 'agenda'
  selectedDocument.value = null
}

function showParticipants() {
  activePanel.value = 'participants'
  selectedDocument.value = null
}

function selectDocument(doc: any) {
  selectedDocument.value = doc
  activePanel.value = 'document'
}
</script>

<template>
  <div class="embedded-portal">
    <div class="embedded-toolbar">
      <button class="btn btn-secondary" type="button" @click="goBack">
        ត្រឡប់ទៅផ្ទាំងសេវាកម្ម
      </button>
      <span>មើលព័ត៌មានកិច្ចប្រជុំ</span>
    </div>
    <main class="page-content" v-if="meeting">
      <div class="meeting-detail">
        <div class="detail-header card">
          <div class="card-body">
            <div class="header-top">
              <div>
                <div class="page-eyebrow">ព័ត៌មានលម្អិតកិច្ចប្រជុំ</div>
                <h1 class="page-title detail-title">{{ getDisplayMeetingTitle(meeting) }}</h1>
                <div class="header-meta">
                  <span :class="['badge', getStatusBadge(meeting.status)]">{{ displayMeetingStatus(meeting.status) }}</span>
                  <span>{{ formatDate(meeting.date) }}</span>
                  <span>{{ formatTimeRange(meeting.startTime, meeting.endTime) }}</span>
                  <span>{{ getDisplayVenue(meeting) }}</span>
                </div>
              </div>
            </div>
            <div class="header-info grid-4">
              <div class="info-item"><span class="info-label">ប្រភេទកិច្ចប្រជុំ</span><span class="info-value">{{ meeting.meetingType }}</span></div>
              <div class="info-item"><span class="info-label">អ្នកចូលរួម</span><span class="info-value attendee-count-text">{{ meeting.expectedAttendees }}</span></div>
              <div class="info-item"><span class="info-label">លេខកូដកិច្ចប្រជុំ</span><span class="info-value code">{{ meeting.meetingCode }}</span></div>
              <div class="info-item compact-link-item"><span class="info-label">តំណកិច្ចប្រជុំ</span><a :href="meeting.meetingLink" target="_blank" rel="noreferrer" class="info-value link">{{ meeting.meetingLink }}</a></div>
            </div>
          </div>
        </div>

        <div class="agenda-layout">
          <div class="agenda-main">
            <div v-if="activePanel === 'agenda'" class="card">
              <div class="card-header">
                <div class="agenda-title-bar">
                  <div class="agenda-title-tabs" role="tablist" aria-label="ព័ត៌មានកិច្ចប្រជុំ">
                    <button :class="['tab', 'agenda-title-tab', { active: activePanel === 'agenda' }]" type="button" role="tab" :aria-selected="activePanel === 'agenda'" @click="showAgenda">របៀបវារៈ</button>
                    <button class="tab agenda-title-tab" type="button" role="tab" aria-selected="false" @click="showParticipants">ប្លង់កៅអី</button>
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

            <div v-else-if="activePanel === 'participants'" class="card">
              <div class="card-header">
                <div class="agenda-title-bar">
                  <div class="agenda-title-tabs" role="tablist" aria-label="ព័ត៌មានកិច្ចប្រជុំ">
                    <button :class="['tab', 'agenda-title-tab', { active: false }]" type="button" role="tab" @click="showAgenda">របៀបវារៈ</button>
                    <button :class="['tab', 'agenda-title-tab', { active: true }]" type="button" role="tab" aria-selected="true" @click="showParticipants">ប្លង់កៅអី</button>
                  </div>
                </div>
              </div>
              <div class="card-body">
                <div class="empty-state">ប្លង់កៅអីត្រូវបានបង្ហាញនៅទីនេះ</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
    <main v-else class="page-content">
      <div class="empty-state">រកមិនឃើញកិច្ចប្រជុំ</div>
    </main>
  </div>
</template>
