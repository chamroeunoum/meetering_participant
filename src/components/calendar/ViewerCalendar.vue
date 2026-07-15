<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Calendar } from 'lucide-vue-next'
import { usePortalStore } from '@/stores/portal'
import {
  calendarPreviewTitles,
  formatCalendarDate,
  formatCalendarTime,
  getCalendarMeetings,
  getCalendarUserById,
  getCalendarUserName,
  getMonthLabel,
  khmerWeekdayShortNames,
  toISODate,
  toKhmerNumeral,
  type CalendarMeeting,
} from '@/data/calendarData'

const router = useRouter()
const portalStore = usePortalStore()
const today = new Date()
const meetings = getCalendarMeetings()
const viewMode = ref<'month' | 'year'>('month')
const visibleMonth = ref(new Date(today.getFullYear(), today.getMonth(), 1))
const selectedMeetingId = ref(meetings.find((meeting) => meeting.date === toISODate(today))?.id || meetings[0]?.id || '')
const activeTimeline = ref<'upcoming' | 'previous'>('upcoming')

const selectedMeeting = computed(() => meetings.find((meeting) => meeting.id === selectedMeetingId.value) || meetings[0])
const monthDays = computed(() => {
  const start = new Date(visibleMonth.value.getFullYear(), visibleMonth.value.getMonth(), 1)
  const gridStart = new Date(start)
  gridStart.setDate(start.getDate() - start.getDay())
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + index)
    return date
  })
})
const meetingsByDate = computed<Record<string, CalendarMeeting[]>>(() => meetings.reduce((groups, meeting) => {
  ;(groups[meeting.date] ||= []).push(meeting)
  return groups
}, {} as Record<string, CalendarMeeting[]>))
const visibleTimelineMeetings = computed(() => {
  const todayIso = toISODate(today)
  return activeTimeline.value === 'upcoming'
    ? meetings.filter((meeting) => meeting.date >= todayIso)
    : meetings.filter((meeting) => meeting.date < todayIso).slice().reverse()
})
const previewAttendees = computed(() => (selectedMeeting.value?.attendeeIds || []).map(getCalendarUserById).filter(Boolean).slice(0, 3))
const yearMonths = Array.from({ length: 12 }, (_, index) => new Date(today.getFullYear(), index, 1))

function goBack() {
  portalStore.clearActivePortal()
  router.push('/')
}

function openMeeting(meeting: CalendarMeeting) {
  router.push({ name: 'meeting-viewer', query: { meeting: meeting.id, from: 'calendar' } })
}

function selectDay(date: Date) {
  const meeting = meetingsByDate.value[toISODate(date)]?.[0]
  if (meeting) selectedMeetingId.value = meeting.id
}

function changeMonth(offset: number) {
  visibleMonth.value = new Date(visibleMonth.value.getFullYear(), visibleMonth.value.getMonth() + offset, 1)
}

function showToday() {
  visibleMonth.value = new Date(today.getFullYear(), today.getMonth(), 1)
  const meeting = meetings.find((item) => item.date === toISODate(today))
  if (meeting) selectedMeetingId.value = meeting.id
}

function monthMeetings(month: Date) {
  const key = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`
  return meetings.filter((meeting) => meeting.date.startsWith(key))
}

function previewTitle(meeting: CalendarMeeting) {
  return calendarPreviewTitles[meeting.id] || meeting.title
}
</script>

<template>
  <div class="embedded-portal calendar-portal">
    <header class="service-header">
      <button class="back-btn" type="button" @click="goBack">
        <ArrowLeft :size="20" :stroke-width="2.5" /> ត្រឡប់
      </button>
      <div class="header-center">
        <div class="header-icon"><Calendar :size="22" :stroke-width="2" /></div>
        <h1 class="header-title">មើលប្រតិទិនកិច្ចប្រជុំ</h1>
      </div>
    </header>

    <main class="page-content calendar-page-content">
      <div v-if="viewMode === 'month'" class="calendar-month-layout">
        <section class="card calendar-shell">
          <div class="card-header calendar-toolbar">
            <div class="calendar-toolbar-title-block">
              <h1>{{ getMonthLabel(visibleMonth) }}</h1>
              <span>{{ toKhmerNumeral(meetings.length) }} កិច្ចប្រជុំ</span>
            </div>
            <div class="calendar-toolbar-center">
              <div class="calendar-mode-switch">
                <button class="btn btn-sm btn-primary" type="button">ខែ</button>
                <button class="btn btn-sm btn-secondary" type="button" @click="viewMode = 'year'">ឆ្នាំ</button>
              </div>
            </div>
            <div class="calendar-toolbar-side calendar-toolbar-side-right">
              <button class="btn btn-secondary btn-sm" type="button" @click="changeMonth(-1)">‹</button>
              <button class="btn btn-secondary btn-sm calendar-today-button" type="button" @click="showToday">ថ្ងៃនេះ</button>
              <button class="btn btn-secondary btn-sm" type="button" @click="changeMonth(1)">›</button>
            </div>
          </div>

          <div class="calendar-weekdays"><span v-for="day in khmerWeekdayShortNames" :key="day">{{ day }}</span></div>
          <div class="calendar-grid">
            <div
              v-for="date in monthDays"
              :key="toISODate(date)"
              :class="['calendar-day', {
                muted: date.getMonth() !== visibleMonth.getMonth(),
                today: toISODate(date) === toISODate(today),
                selected: meetingsByDate[toISODate(date)]?.some((meeting) => meeting.id === selectedMeeting?.id),
                'has-meetings': meetingsByDate[toISODate(date)]?.length,
              }]"
              :role="meetingsByDate[toISODate(date)]?.length ? 'button' : undefined"
              :tabindex="meetingsByDate[toISODate(date)]?.length ? 0 : undefined"
              @click="selectDay(date)"
              @keydown.enter.prevent="selectDay(date)"
            >
              <div class="calendar-day-top"><span class="calendar-date-number">{{ toKhmerNumeral(date.getDate()) }}</span></div>
              <div v-if="meetingsByDate[toISODate(date)]?.length" class="calendar-event-dots">
                <span v-for="meeting in meetingsByDate[toISODate(date)]?.slice(0, 3)" :key="meeting.id" />
              </div>
              <div class="calendar-meeting-stack">
                <button
                  v-for="meeting in meetingsByDate[toISODate(date)]?.slice(0, 1)"
                  :key="meeting.id"
                  :class="['calendar-meeting-card', { active: meeting.id === selectedMeeting?.id }]"
                  type="button"
                  @click.stop="selectedMeetingId = meeting.id"
                >
                  <strong>{{ previewTitle(meeting) }}</strong>
                  <span>{{ formatCalendarTime(meeting.startTime, meeting.endTime) }}</span>
                </button>
                <span v-if="(meetingsByDate[toISODate(date)]?.length || 0) > 1" class="calendar-more-count">+{{ (meetingsByDate[toISODate(date)]?.length || 0) - 1 }}</span>
              </div>
            </div>
          </div>
        </section>

        <aside class="calendar-side-panel">
          <article v-if="selectedMeeting" class="calendar-preview-card">
            <div class="calendar-preview-heading"><h2>{{ selectedMeeting.title }}</h2></div>
            <div class="calendar-preview-meta">
              <span>{{ formatCalendarDate(selectedMeeting.date) }}</span>
              <span>{{ formatCalendarTime(selectedMeeting.startTime, selectedMeeting.endTime) }}</span>
              <span>{{ selectedMeeting.venue }}</span>
            </div>
            <div class="calendar-preview-attendees">
              <span class="calendar-preview-label">អ្នកចូលរួម</span>
              <div class="calendar-attendee-list">
                <div v-for="attendee in previewAttendees" :key="attendee!.id" class="calendar-attendee-row">
                  <span class="calendar-attendee-avatar">{{ attendee!.avatar }}</span>
                  <span>{{ getCalendarUserName(attendee) }}</span>
                </div>
              </div>
            </div>
            <button class="btn btn-primary calendar-view-detail" type="button" @click="openMeeting(selectedMeeting)">មើលព័ត៌មានលម្អិត</button>
          </article>

          <section class="calendar-panel-section">
            <div class="calendar-timeline-tabs">
              <button :class="['calendar-timeline-tab', { active: activeTimeline === 'upcoming' }]" type="button" @click="activeTimeline = 'upcoming'">ខាងមុខ</button>
              <button :class="['calendar-timeline-tab', { active: activeTimeline === 'previous' }]" type="button" @click="activeTimeline = 'previous'">កន្លងទៅ</button>
            </div>
            <div class="calendar-panel-list">
              <button v-for="meeting in visibleTimelineMeetings" :key="meeting.id" :class="['calendar-panel-list-item', { active: selectedMeeting?.id === meeting.id }]" type="button" @click="selectedMeetingId = meeting.id">
                <span>{{ formatCalendarDate(meeting.date) }}</span>
                <strong>{{ previewTitle(meeting) }}</strong>
                <em>{{ formatCalendarTime(meeting.startTime, meeting.endTime) }}</em>
              </button>
              <div v-if="!visibleTimelineMeetings.length" class="empty-state compact">មិនមានកិច្ចប្រជុំក្នុងបញ្ជីនេះទេ។</div>
            </div>
          </section>
        </aside>
      </div>

      <section v-else class="card calendar-shell">
        <div class="card-header calendar-toolbar calendar-year-toolbar">
          <div class="calendar-toolbar-center"><h1>{{ toKhmerNumeral(today.getFullYear()) }}</h1><span>{{ toKhmerNumeral(meetings.length) }} កិច្ចប្រជុំ</span></div>
          <div class="calendar-mode-switch"><button class="btn btn-sm btn-secondary" type="button" @click="viewMode = 'month'">ខែ</button><button class="btn btn-sm btn-primary" type="button">ឆ្នាំ</button></div>
        </div>
        <div class="card-body">
          <div class="calendar-year-view">
            <article v-for="month in yearMonths" :key="month.getMonth()" class="card calendar-month-card">
              <div class="card-header calendar-month-card-header"><span class="card-title">{{ getMonthLabel(month) }}</span><span class="badge badge-neutral">{{ toKhmerNumeral(monthMeetings(month).length) }} កិច្ចប្រជុំ</span></div>
              <div class="card-body calendar-month-card-body">
                <button v-for="meeting in monthMeetings(month)" :key="meeting.id" class="calendar-month-meeting" type="button" @click="openMeeting(meeting)"><div><strong>{{ meeting.title }}</strong><span>{{ formatCalendarDate(meeting.date) }}</span></div><span>{{ formatCalendarTime(meeting.startTime, meeting.endTime) }}</span></button>
                <div v-if="!monthMeetings(month).length" class="empty-state compact">មិនមានកិច្ចប្រជុំក្នុងខែនេះទេ។</div>
              </div>
            </article>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style src="./calendar.css"></style>
