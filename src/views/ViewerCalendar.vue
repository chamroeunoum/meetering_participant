<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePortalStore } from '@/stores/portal'
import { ArrowLeft, Calendar, ExternalLink } from 'lucide-vue-next'
import { formatDate, formatTimeRange, getMeetings, getUserById, getUserName } from '@/utils/data'

const router = useRouter()
const portalStore = usePortalStore()

const khmerMonthNames = [
  'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
  'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ',
]
const khmerWeekdayShort = ['អាទិត្យ', 'ចន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍']

function toKhmerNumeral(value: number): string {
  const digits = ['០','១','២','៣','៤','៥','៦','៧','៨','៩']
  return String(value).replace(/\d/g, (d) => digits[Number(d)])
}

function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getCalendarMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function getMonthLabel(date: Date): string {
  return `${khmerMonthNames[date.getMonth()]} ${toKhmerNumeral(date.getFullYear())}`
}

const meetings = computed(() =>
  getMeetings().slice().sort((a: any, b: any) =>
    `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`)
  )
)

function getDisplayMeetingTitle(m: any) {
  const t: Record<string, string> = {
    m1: 'ការពិនិត្យការផ្លាស់ប្តូរឌីជីថល ត្រីមាសទី៤ ឆ្នាំ២០២៦',
    m2: 'កិច្ចប្រជុំផែនការគម្រោងឌីជីថល',
    m3: 'កិច្ចប្រជុំគណៈកម្មការត្រួតពិនិត្យ',
  }
  return t[m.id] || m.title
}

function getCalendarPreviewTitle(m: any) {
  const t: Record<string, string> = {
    m1: 'Q4 Digital Transformation Review',
    m2: 'Product Sprint Planning',
    m3: 'Board Committee Review',
  }
  return t[m.id] || m.title
}

const today = new Date()
const viewMode = ref<'month' | 'year'>('month')
const visibleMonth = ref(new Date(today.getFullYear(), today.getMonth(), 1))
const activeTimeline = ref<'upcoming' | 'previous'>('upcoming')

const todayMeeting = meetings.value.find((m: any) => m.date === toISODate(today))
const selectedMeetingId = ref(todayMeeting?.id || meetings.value[0]?.id)
const selectedMeeting = computed(() => meetings.value.find((m: any) => m.id === selectedMeetingId.value))

const monthStart = computed(() => new Date(visibleMonth.value.getFullYear(), visibleMonth.value.getMonth(), 1))
const gridStart = computed(() => {
  const d = new Date(monthStart.value)
  d.setDate(d.getDate() - d.getDay())
  return d
})

const monthDays = computed(() =>
  Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart.value)
    d.setDate(gridStart.value.getDate() + i)
    return d
  })
)

const meetingsByDate = computed(() => {
  const groups: Record<string, any[]> = {}
  meetings.value.forEach((m: any) => {
    if (!groups[m.date]) groups[m.date] = []
    groups[m.date].push(m)
  })
  return groups
})

const meetingsByMonth = computed(() => {
  const groups: Record<string, any[]> = {}
  meetings.value.forEach((m: any) => {
    const key = m.date.slice(0, 7)
    if (!groups[key]) groups[key] = []
    groups[key].push(m)
  })
  return groups
})

const todayIso = toISODate(new Date())
const upcomingMeetings = computed(() => meetings.value.filter((m: any) => m.date >= todayIso))
const previousMeetings = computed(() => meetings.value.filter((m: any) => m.date < todayIso).slice().reverse())
const visibleMeetings = computed(() => activeTimeline.value === 'upcoming' ? upcomingMeetings.value : previousMeetings.value)

const yearMonths = Array.from({ length: 12 }, (_, i) => new Date(today.getFullYear(), i, 1))
function selectMeeting(id: string) {
  selectedMeetingId.value = id
}

function selectAndGo(id: string) {
  goToMeeting(id)
}

function prevMonth() {
  visibleMonth.value = new Date(visibleMonth.value.getFullYear(), visibleMonth.value.getMonth() - 1, 1)
}

function nextMonth() {
  visibleMonth.value = new Date(visibleMonth.value.getFullYear(), visibleMonth.value.getMonth() + 1, 1)
}

function goToday() {
  visibleMonth.value = new Date(today.getFullYear(), today.getMonth(), 1)
  const tm = meetings.value.find((m: any) => m.date === toISODate(today))
  if (tm) selectedMeetingId.value = tm.id
}

function goBack() {
  portalStore.clearActivePortal()
  router.push('/portal')
}

function goToMeeting(id: string) {
  portalStore.setActivePortal('viewer-calendar')
  router.push(`/meeting-viewer?from=calendar&id=${id}`)
}
</script>

<template>
  <div class="service-page">
    <header class="service-header">
      <button class="back-btn" type="button" @click="goBack">
        <ArrowLeft :size="20" :stroke-width="2.5" />
        ត្រឡប់
      </button>
      <div class="header-center">
        <div class="header-icon"><Calendar :size="22" :stroke-width="2" /></div>
        <h1 class="header-title">ប្រតិទិនកិច្ចប្រជុំ</h1>
      </div>
    </header>

    <!-- Month View -->
    <template v-if="viewMode === 'month'">
      <div class="calendar-layout">
        <section class="calendar-shell">
          <!-- Toolbar -->
          <div class="cal-toolbar">
            <div class="cal-tb-left">
              <h2>{{ getMonthLabel(visibleMonth) }}</h2>
              <span>{{ toKhmerNumeral(meetings.length) }} កិច្ចប្រជុំ</span>
            </div>
            <div class="cal-tb-center">
              <div class="mode-switch">
                <button :class="['btn-sm', { active: viewMode === 'month' }]" type="button" @click="viewMode = 'month'">ខែ</button>
                <button :class="['btn-sm', { active: viewMode === 'year' }]" type="button" @click="viewMode = 'year'">ឆ្នាំ</button>
              </div>
            </div>
            <div class="cal-tb-right">
              <button class="btn-nav" type="button" @click="prevMonth">‹</button>
              <button class="btn-today" type="button" @click="goToday">ថ្ងៃនេះ</button>
              <button class="btn-nav" type="button" @click="nextMonth">›</button>
            </div>
          </div>

          <!-- Weekday headers -->
          <div class="cal-weekdays">
            <span v-for="d in khmerWeekdayShort" :key="d">{{ d }}</span>
          </div>

          <!-- Grid -->
          <div class="cal-grid">
            <div
              v-for="date in monthDays"
              :key="toISODate(date)"
              :class="['cal-day', {
                muted: date.getMonth() !== visibleMonth.getMonth(),
                today: toISODate(date) === toISODate(today),
                selected: meetingsByDate[toISODate(date)]?.some((m: any) => m.id === selectedMeeting?.id),
                'has-meetings': meetingsByDate[toISODate(date)]?.length
              }]"
              :role="meetingsByDate[toISODate(date)]?.length ? 'button' : undefined"
              :tabindex="meetingsByDate[toISODate(date)]?.length ? 0 : undefined"
              @click="meetingsByDate[toISODate(date)]?.[0] && selectMeeting(meetingsByDate[toISODate(date)][0].id)"
            >
              <div class="cal-day-top">
                <span class="cal-date-num">{{ toKhmerNumeral(date.getDate()) }}</span>
              </div>
              <div v-if="meetingsByDate[toISODate(date)]?.length" class="cal-dots">
                <span v-for="m in meetingsByDate[toISODate(date)].slice(0,3)" :key="m.id" />
              </div>
              <div class="cal-stack">
                <button
                  v-for="m in meetingsByDate[toISODate(date)]?.slice(0,1)"
                  :key="m.id"
                  :class="['cal-meeting-card', { active: selectedMeeting?.id === m.id }]"
                  type="button"
                  @click.stop="selectMeeting(m.id)" @dblclick.stop="goToMeeting(m.id)"
                >
                  <strong>{{ getCalendarPreviewTitle(m) }}</strong>
                  <span>{{ formatTimeRange(m.startTime, m.endTime) }}</span>
                </button>
                <span v-if="meetingsByDate[toISODate(date)]?.length > 1" class="cal-more">
                  +{{ meetingsByDate[toISODate(date)].length - 1 }}
                </span>
              </div>
            </div>
          </div>
        </section>

        <!-- Side panel -->
        <aside class="cal-side">
          <div v-if="selectedMeeting" class="cal-preview">
            <h3>{{ getDisplayMeetingTitle(selectedMeeting) }}</h3>
            <div class="cal-preview-meta">
              <span>{{ formatDate(selectedMeeting.date) }}</span>
              <span>{{ formatTimeRange(selectedMeeting.startTime, selectedMeeting.endTime) }}</span>
              <span>{{ selectedMeeting.venue }}</span>
            </div>
            <div class="cal-preview-attendees">
              <span class="cal-label">អ្នកចូលរួម</span>
              <div v-for="uid in selectedMeeting.attendeeIds?.slice(0,3)" :key="uid" class="cal-att-row">
                <span class="cal-avatar">{{ getUserById(uid)?.avatar || '--' }}</span>
                <span>{{ getUserName(getUserById(uid)) }}</span>
              </div>
            </div>
            <button class="cal-view-detail" type="button" @click="goToMeeting(selectedMeeting.id)">
              <ExternalLink :size="15" :stroke-width="2.5" /> មើលព័ត៌មានលម្អិត
            </button>
          </div>
          <div v-else class="cal-preview empty">ជ្រើសរើសកាលបរិច្ឆេទ</div>

          <section class="cal-panel">
            <div class="cal-timeline-tabs">
              <button :class="['tl-tab', { active: activeTimeline === 'upcoming' }]" type="button" @click="activeTimeline = 'upcoming'">ខាងមុខ</button>
              <button :class="['tl-tab', { active: activeTimeline === 'previous' }]" type="button" @click="activeTimeline = 'previous'">កន្លងទៅ</button>
            </div>
            <div class="cal-panel-list">
              <button
                v-for="m in visibleMeetings"
                :key="m.id"
                :class="['cal-panel-item', { active: selectedMeeting?.id === m.id }]"
                type="button"
                @click="goToMeeting(m.id)"
              >
                <span>{{ formatDate(m.date) }}</span>
                <strong>{{ getCalendarPreviewTitle(m) }}</strong>
                <em>{{ formatTimeRange(m.startTime, m.endTime) }}</em>
              </button>
              <div v-if="!visibleMeetings.length" class="empty-state compact">មិនមានកិច្ចប្រជុំ</div>
            </div>
          </section>
        </aside>
      </div>
    </template>

    <!-- Year View -->
    <template v-else>
      <section class="calendar-shell">
        <div class="cal-toolbar cal-year-tb">
          <div class="cal-tb-center"><h2>{{ toKhmerNumeral(today.getFullYear()) }}</h2><span>{{ toKhmerNumeral(meetings.length) }} កិច្ចប្រជុំ</span></div>
          <div class="mode-switch">
            <button :class="['btn-sm', { active: viewMode === 'month' }]" type="button" @click="viewMode = 'month'">ខែ</button>
            <button :class="['btn-sm', { active: viewMode === 'year' }]" type="button" @click="viewMode = 'year'">ឆ្នាំ</button>
          </div>
        </div>
        <div class="cal-year-grid">
          <article v-for="md in yearMonths" :key="getCalendarMonthKey(md)" class="cal-month-card">
            <div class="cal-month-header">
              <span class="cal-month-label">{{ getMonthLabel(md) }}</span>
              <span class="badge-neutral">{{ toKhmerNumeral((meetingsByMonth[getCalendarMonthKey(md)] || []).length) }}</span>
            </div>
            <div class="cal-month-body">
              <div v-if="meetingsByMonth[getCalendarMonthKey(md)]?.length">
                <div v-for="m in meetingsByMonth[getCalendarMonthKey(md)]" :key="m.id" class="cal-month-item" role="button" tabindex="0" @click="goToMeeting(m.id)" @keydown.enter="goToMeeting(m.id)">
                  <div>
                    <strong>{{ getDisplayMeetingTitle(m) }}</strong>
                    <span>{{ formatDate(m.date) }}</span>
                  </div>
                  <span>{{ formatTimeRange(m.startTime, m.endTime) }}</span>
                </div>
              </div>
              <div v-else class="empty-state compact">មិនមានកិច្ចប្រជុំ</div>
            </div>
          </article>
        </div>
      </section>
    </template>
  </div>

</template>

<style scoped>

.service-page { max-width: 1200px; margin: 0 auto; padding: 8px 24px 48px; }
.service-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 24px 0 20px; border-bottom: 1px solid var(--color-border-soft); margin-bottom: 24px; }
.back-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; font-size: 14px; font-weight: 600; color: var(--color-primary); background: rgba(255,255,255,0.8); border: 1px solid var(--color-border); border-radius: 10px; cursor: pointer; transition: all var(--transition); }
.back-btn:hover { background: #fff; border-color: var(--color-primary); }
.header-center { display: flex; align-items: center; gap: 10px; }
.header-icon { display: grid; place-items: center; width: 40px; height: 40px; color: var(--color-primary); background: rgba(13,98,213,0.08); border-radius: 10px; }
.header-title { margin: 0; font-family: var(--font-heading); font-size: 20px; font-weight: 700; color: var(--color-text); }

/* Layout */
.calendar-layout { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 20px; align-items: start; }

/* Shell */
.calendar-shell { border: 1px solid var(--color-border-soft); border-radius: 18px; background: #fff; box-shadow: var(--shadow-sm); overflow: visible; }
.cal-toolbar { display: grid; grid-template-columns: minmax(160px,1fr) auto minmax(160px,1fr); align-items: center; gap: 14px; padding: 18px 22px 14px; }
.cal-year-tb { grid-template-columns: 1fr auto 1fr; }
.cal-year-tb .mode-switch { justify-self: end; }

.cal-tb-left { display: grid; gap: 2px; }
.cal-tb-left h2 { margin: 0; font-size: 22px; font-weight: 800; color: var(--color-text); line-height: 1.2; }
.cal-tb-left span { color: #9494b0; font-size: 12px; font-weight: 800; }
.cal-tb-center { display: grid; justify-items: center; gap: 2px; }
.cal-tb-center h2 { margin: 0; font-size: 22px; font-weight: 800; color: var(--color-text); }
.cal-tb-center span { color: #9494b0; font-size: 12px; font-weight: 800; }
.cal-tb-right { display: flex; align-items: center; justify-content: flex-end; gap: 8px; }

.mode-switch { display: inline-flex; gap: 4px; padding: 3px; border: 1px solid var(--color-border); border-radius: 6px; background: #fff; }
.mode-switch .btn-sm { min-height: 30px; padding: 4px 10px; font-size: 14px; font-weight: 500; border: none; border-radius: 6px; background: transparent; color: var(--color-text-secondary); cursor: pointer; }
.mode-switch .btn-sm.active { background: var(--color-primary); color: #fff; }

.btn-nav { width: 34px; height: 34px; padding: 0; border: 1px solid var(--color-border); border-radius: 999px; background: #fff; color: #007aff; font-size: 24px; font-weight: 500; line-height: 1; cursor: pointer; display: grid; place-items: center; }
.btn-today { padding: 5px 14px; border: 1px solid var(--color-border); border-radius: 999px; background: #fff; color: var(--color-text); font-size: 13px; font-weight: 800; cursor: pointer; min-width: 72px; }

.cal-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); padding: 0; color: #8e8e93; font-size: 11px; font-weight: 800; text-align: center; border-top: 1px solid #f1f3f7; border-bottom: 1px solid #f1f3f7; background: #fff; }
.cal-weekdays span { padding: 12px 6px 10px; background: #fff; }

.cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); background: #fff; }
.cal-day { position: relative; min-height: 116px; padding: 8px 8px 10px; border-right: 1px solid #f4f5f8; border-bottom: 1px solid #f4f5f8; background: #fff; transition: background var(--transition); }
.cal-day:hover { background: #f8fbff; }
.cal-day.has-meetings { cursor: pointer; }
.cal-day.muted { background: #fbfbfd; color: #c7c7cc; }
.cal-day.selected { background: #f8fbff; box-shadow: inset 0 0 0 1px #d8eaff; }

.cal-day-top { display: flex; justify-content: center; margin-bottom: 5px; font-weight: 700; }
.cal-date-num { display: inline-grid; width: 31px; height: 31px; place-items: center; border-radius: 50%; color: #1c1c1e; font-size: 14px; line-height: 1; }
.cal-day.muted .cal-date-num { color: #c7c7cc; }
.cal-day.today .cal-date-num { color: #007aff; font-weight: 900; }
.cal-day.selected .cal-date-num { background: #007aff; color: #fff; }

.cal-dots { display: flex; justify-content: center; gap: 3px; min-height: 5px; margin-bottom: 7px; }
.cal-dots span { width: 5px; height: 5px; border-radius: 50%; background: #007aff; }

.cal-stack { display: grid; gap: 5px; }
.cal-meeting-card { display: grid; gap: 1px; width: 100%; padding: 6px 7px; border: none; border-radius: 7px; background: #eef6ff; color: #005eb8; text-align: center; cursor: pointer; transition: background var(--transition); }
.cal-meeting-card:hover { background: #e1f0ff; }
.cal-meeting-card.active { background: #007aff; color: #fff; }
.cal-meeting-card strong { overflow: hidden; font-size: 11px; line-height: 1.25; text-overflow: ellipsis; white-space: nowrap; }
.cal-meeting-card span { color: inherit; font-size: 10px; opacity: 0.82; }
.cal-more { display: block; color: #8e8e93; font-size: 11px; font-weight: 800; text-align: center; }

/* Side panel */
.cal-side { display: grid; gap: 14px; position: sticky; top: 18px; align-self: start; }
.cal-preview { display: grid; gap: 12px; padding: 18px; border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: #fff; box-shadow: var(--shadow-sm); }
.cal-preview.empty { place-items: center; min-height: 120px; color: var(--color-text-secondary); font-size: 14px; }
.cal-preview h3 { margin: 0; font-size: 17px; line-height: 1.45; color: var(--color-text); }
.cal-preview-meta { display: flex; align-items: center; gap: 8px; padding: 10px 0; border-top: 1px solid var(--color-border); border-bottom: 1px solid var(--color-border); color: var(--color-text); font-size: 12px; font-weight: 700; }
.cal-preview-meta span + span::before { content: "•"; margin-right: 8px; color: #9494b0; }
.cal-label { display: block; margin-bottom: 7px; color: #9494b0; font-size: 12px; font-weight: 900; }
.cal-att-row { display: grid; grid-template-columns: 30px 1fr; align-items: center; gap: 10px; color: var(--color-text); font-size: 14px; font-weight: 700; }

.cal-view-detail {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-top: 12px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  background: var(--color-primary);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background var(--transition);
}
.cal-view-detail:hover {
  background: var(--color-primary-hover);
}
.cal-avatar { display: inline-grid; width: 30px; height: 30px; place-items: center; border-radius: 50%; background: var(--color-primary-light, #e8f4fc); color: var(--color-primary); font-size: 12px; font-weight: 900; }

.cal-view-detail {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-top: 12px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  background: var(--color-primary);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background var(--transition);
}
.cal-view-detail:hover {
  background: var(--color-primary-hover);
}


.cal-view-detail {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-top: 12px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  background: var(--color-primary);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background var(--transition);
}
.cal-view-detail:hover {
  background: var(--color-primary-hover);
}
/* Timeline panel */

.cal-view-detail {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-top: 12px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  background: var(--color-primary);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background var(--transition);
}
.cal-view-detail:hover {
  background: var(--color-primary-hover);
}
.cal-panel { display: grid; gap: 10px; padding: 14px; border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: #fff; box-shadow: var(--shadow-sm); }

.cal-view-detail {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-top: 12px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  background: var(--color-primary);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background var(--transition);
}
.cal-view-detail:hover {
  background: var(--color-primary-hover);
}
.cal-timeline-tabs { display: grid; grid-template-columns: repeat(2, 1fr); gap: 4px; padding: 3px; border: 1px solid var(--color-border); border-radius: 6px; background: #f8fafc; }

.cal-view-detail {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-top: 12px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  background: var(--color-primary);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background var(--transition);
}
.cal-view-detail:hover {
  background: var(--color-primary-hover);
}
.tl-tab { min-height: 34px; border: none; border-radius: 6px; background: transparent; color: var(--color-text-secondary); font-size: 13px; font-weight: 900; cursor: pointer; }

.cal-view-detail {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-top: 12px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  background: var(--color-primary);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background var(--transition);
}
.cal-view-detail:hover {
  background: var(--color-primary-hover);
}
.tl-tab.active { background: #fff; color: var(--color-primary); box-shadow: var(--shadow-sm); }

.cal-view-detail {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-top: 12px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  background: var(--color-primary);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background var(--transition);
}
.cal-view-detail:hover {
  background: var(--color-primary-hover);
}


.cal-view-detail {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-top: 12px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  background: var(--color-primary);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background var(--transition);
}
.cal-view-detail:hover {
  background: var(--color-primary-hover);
}
.cal-panel-list { display: grid; gap: 8px; max-height: 280px; overflow: auto; }

.cal-view-detail {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-top: 12px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  background: var(--color-primary);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background var(--transition);
}
.cal-view-detail:hover {
  background: var(--color-primary-hover);
}
.cal-panel-item { display: grid; gap: 3px; width: 100%; padding: 11px 12px; border: 1px solid var(--color-border); border-radius: 6px; background: #fbfcff; text-align: left; cursor: pointer; transition: border-color var(--transition), background var(--transition); }

.cal-view-detail {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-top: 12px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  background: var(--color-primary);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background var(--transition);
}
.cal-view-detail:hover {
  background: var(--color-primary-hover);
}
.cal-panel-item:hover, .cal-panel-item.active { border-color: #93c5fd; background: #eff6ff; }

.cal-view-detail {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-top: 12px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  background: var(--color-primary);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background var(--transition);
}
.cal-view-detail:hover {
  background: var(--color-primary-hover);
}
.cal-panel-item span { color: #9494b0; font-size: 12px; font-weight: 700; }

.cal-view-detail {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-top: 12px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  background: var(--color-primary);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background var(--transition);
}
.cal-view-detail:hover {
  background: var(--color-primary-hover);
}
.cal-panel-item strong { color: var(--color-text); font-size: 13px; line-height: 1.35; }

.cal-view-detail {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-top: 12px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  background: var(--color-primary);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background var(--transition);
}
.cal-view-detail:hover {
  background: var(--color-primary-hover);
}
.cal-panel-item em { color: var(--color-text-secondary); font-size: 12px; font-style: normal; font-weight: 700; }

.cal-view-detail {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-top: 12px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  background: var(--color-primary);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background var(--transition);
}
.cal-view-detail:hover {
  background: var(--color-primary-hover);
}


.cal-view-detail {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-top: 12px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  background: var(--color-primary);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background var(--transition);
}
.cal-view-detail:hover {
  background: var(--color-primary-hover);
}
/* Year view */

.cal-view-detail {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-top: 12px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  background: var(--color-primary);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background var(--transition);
}
.cal-view-detail:hover {
  background: var(--color-primary-hover);
}
.cal-year-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 18px; padding: 24px; }

.cal-view-detail {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-top: 12px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  background: var(--color-primary);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background var(--transition);
}
.cal-view-detail:hover {
  background: var(--color-primary-hover);
}
.cal-month-card { border: 1px solid var(--color-border); border-radius: 8px; overflow: hidden; background: #fff; }

.cal-view-detail {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-top: 12px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  background: var(--color-primary);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background var(--transition);
}
.cal-view-detail:hover {
  background: var(--color-primary-hover);
}
.cal-month-header { display: flex; align-items: center; justify-content: space-between; padding: 16px 18px; border-bottom: 1px solid var(--color-border); }

.cal-view-detail {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-top: 12px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  background: var(--color-primary);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background var(--transition);
}
.cal-view-detail:hover {
  background: var(--color-primary-hover);
}
.cal-month-label { font-size: 15px; font-weight: 900; color: var(--color-text); }

.cal-view-detail {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-top: 12px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  background: var(--color-primary);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background var(--transition);
}
.cal-view-detail:hover {
  background: var(--color-primary-hover);
}
.badge-neutral { display: inline-flex; align-items: center; padding: 2px 10px; border-radius: 999px; font-size: 12px; background: var(--color-bg); color: var(--color-text-secondary); }


.cal-month-body { display: grid; gap: 10px; padding: 16px 18px; }

.cal-view-detail {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-top: 12px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  background: var(--color-primary);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background var(--transition);
}
.cal-view-detail:hover {
  background: var(--color-primary-hover);
}
.cal-month-item { display: flex; justify-content: space-between; align-items: flex-start; gap: 14px; padding: 12px 14px; border: 1px solid var(--color-border); border-radius: 12px; background: #fff; cursor: pointer; transition: border-color var(--transition); }

.cal-view-detail {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-top: 12px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  background: var(--color-primary);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background var(--transition);
}
.cal-view-detail:hover {
  background: var(--color-primary-hover);
}
.cal-month-item:hover { border-color: var(--color-primary); }

.cal-view-detail {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-top: 12px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  background: var(--color-primary);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background var(--transition);
}
.cal-view-detail:hover {
  background: var(--color-primary-hover);
}
.cal-month-item strong { display: block; margin-bottom: 4px; font-size: 14px; }

.cal-view-detail {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-top: 12px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  background: var(--color-primary);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background var(--transition);
}
.cal-view-detail:hover {
  background: var(--color-primary-hover);
}
.cal-month-item span { display: block; font-size: 12px; color: var(--color-text-secondary); }

.cal-view-detail {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-top: 12px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  background: var(--color-primary);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background var(--transition);
}
.cal-view-detail:hover {
  background: var(--color-primary-hover);
}
.empty-state { text-align: center; color: var(--color-text-secondary); font-size: 13px; padding: 20px; }

.cal-view-detail {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-top: 12px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  background: var(--color-primary);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background var(--transition);
}
.cal-view-detail:hover {
  background: var(--color-primary-hover);
}
.empty-state.compact { padding: 10px; }

.cal-view-detail {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-top: 12px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  background: var(--color-primary);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background var(--transition);
}
.cal-view-detail:hover {
  background: var(--color-primary-hover);
}


.cal-view-detail {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-top: 12px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  background: var(--color-primary);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background var(--transition);
}
.cal-view-detail:hover {
  background: var(--color-primary-hover);
}
@media (max-width: 900px) {

.cal-view-detail {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-top: 12px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  background: var(--color-primary);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background var(--transition);
}
.cal-view-detail:hover {
  background: var(--color-primary-hover);
}
  .calendar-layout { grid-template-columns: 1fr; }

.cal-view-detail {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-top: 12px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  background: var(--color-primary);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background var(--transition);
}
.cal-view-detail:hover {
  background: var(--color-primary-hover);
}
  .cal-side { position: static; }

.cal-view-detail {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-top: 12px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  background: var(--color-primary);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background var(--transition);
}
.cal-view-detail:hover {
  background: var(--color-primary-hover);
}
  .service-header { flex-direction: column; align-items: flex-start; }

.cal-view-detail {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-top: 12px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  background: var(--color-primary);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background var(--transition);
}
.cal-view-detail:hover {
  background: var(--color-primary-hover);
}
}

.cal-view-detail {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  margin-top: 12px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  background: var(--color-primary);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background var(--transition);
}
.cal-view-detail:hover {
  background: var(--color-primary-hover);
}
@media (max-width: 640px) {
  .service-page { padding: 8px 16px 48px; }
  .cal-toolbar { grid-template-columns: 1fr; justify-items: center; text-align: center; }
  .cal-tb-left { justify-items: center; }
  .cal-tb-right { justify-content: center; }
  .cal-day { min-height: 80px; padding: 4px; }
  .cal-date-num { width: 24px; height: 24px; font-size: 12px; }

}
</style>
