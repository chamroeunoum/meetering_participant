<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/utils/api'
import { formatDate, formatTimeRange } from '@/utils/data'
import {
  ArrowLeft, Mail, Copy, CheckCheck, RefreshCw, Send, SendHorizontal, Calendar, Clock, MapPin, Users,
} from 'lucide-vue-next'

const router = useRouter()

onMounted(() => { loadMeetings() })

const meetings = ref<any[]>([])
const selectedMeeting = ref<any | null>(null)
const invitations = ref<any[]>([])
const copiedId = ref<number | null>(null)
const loading = ref(false)
const toast = ref<{ msg: string; type: string } | null>(null)

function showToast(msg: string, type: 'success' | 'error') {
  toast.value = { msg, type }
  setTimeout(() => { toast.value = null }, 3000)
}

function goBack() {
  router.push('/')
}

const sentCount = computed(() => invitations.value.filter((i: any) => i.invitation_sent).length)
const checkedInCount = computed(() => invitations.value.filter((i: any) => i.checked_in).length)
const allCodesGenerated = computed(() => invitations.value.every((i: any) => i.unique_code))
const hasUnsent = computed(() => invitations.value.some((i: any) => !i.invitation_sent && i.unique_code))

async function loadMeetings() {
  try {
    const res = await api.get('/meetings')
    const data = res.data?.data || res.data || []
    meetings.value = Array.isArray(data) ? data : []
    if (meetings.value.length > 0 && !selectedMeeting.value) {
      selectMeetingFn(meetings.value[0].id)
    }
  } catch {
    showToast('មិនអាចផ្ទុកបញ្ជីកិច្ចប្រជុំបានទេ', 'error')
  }
}

async function selectMeetingFn(id: any) {
  const strId = String(id)
  selectedMeeting.value = meetings.value.find((m: any) => String(m.id) === strId) || null
  await loadInvitations(strId)
}

async function loadInvitations(meetingId: string) {
  try {
    const res = await api.get('/' + meetingId + '/invitations')
    invitations.value = res.data?.data || []
  } catch {
    invitations.value = []
  }
}

async function handleGenerateCodes() {
  if (!selectedMeeting.value) return
  loading.value = true
  try {
    await api.post('/' + selectedMeeting.value.id + '/invitations/generate-codes')
    await loadInvitations(selectedMeeting.value.id)
    showToast('បានបង្កើតលេខកូដសម្រាប់អ្នកចូលរួមទាំងអស់', 'success')
  } catch {
    showToast('បង្កើតលេខកូដមិនបានជោគជ័យ', 'error')
  } finally {
    loading.value = false
  }
}

async function handleGenerateSingleCode(memberId: number) {
  if (!selectedMeeting.value) return
  try {
    const res = await api.post('/' + selectedMeeting.value.id + '/invitations/generate-code/' + memberId)
    await loadInvitations(selectedMeeting.value.id)
    showToast(res.data?.message || 'បានបង្កើតលេខកូដ', 'success')
  } catch {
    showToast('បង្កើតលេខកូដមិនបានជោគជ័យ', 'error')
  }
}

function copyCode(code: string, pid: number) {
  navigator.clipboard.writeText(code)
  copiedId.value = pid
  showToast('បានចម្លងលេខកូដ', 'success')
  setTimeout(() => { copiedId.value = null }, 2000)
}

function copyAllCodes() {
  const codes = invitations.value.map((i: any) => i.name + ': ' + (i.unique_code || '—')).join('\n')
  navigator.clipboard.writeText(codes)
  showToast('បានចម្លងលេខកូដ\u1791\u17d2\u17b6\u17c1\u1793\u17cb\u17a2\u179f\u17d2\u1791\u17b6\u1794', 'success')
}

async function handleMarkSent(memberId: number) {
  if (!selectedMeeting.value) return
  try {
    await api.post('/' + selectedMeeting.value.id + '/invitations/mark-sent/' + memberId)
    await loadInvitations(selectedMeeting.value.id)
    showToast('បានសម្គាល់ថាបានផ្ញើការអញ្ជើញ', 'success')
  } catch {
    showToast('ដំណើរការមិនបានជោគជ័យ', 'error')
  }
}

async function handleSendInvitation(memberId: number) {
  if (!selectedMeeting.value) return
  loading.value = true
  try {
    const res = await api.post('/' + selectedMeeting.value.id + '/invitations/send/' + memberId)
    await loadInvitations(selectedMeeting.value.id)
    showToast(res.data?.message || 'បានផ្ញើការអញ្ជើញតាមអ៊ីមែល', 'success')
  } catch (err: any) {
    const msg = err.response?.data?.message || 'ផ្ញើអ៊ីមែលមិនបានជោគជ័យ'
    showToast(msg, 'error')
  } finally {
    loading.value = false
  }
}

async function handleSendAll() {
  if (!selectedMeeting.value) return
  loading.value = true
  try {
    const res = await api.post('/' + selectedMeeting.value.id + '/invitations/send-all')
    await loadInvitations(selectedMeeting.value.id)
    showToast(res.data?.message || 'បានផ្ញើការអញ្ជើញទាំងអស់', 'success')
  } catch (err: any) {
    const msg = err.response?.data?.message || 'ផ្ញើអ៊ីមែលមិនបានជោគជ័យ'
    showToast(msg, 'error')
  } finally {
    loading.value = false
  }
}

async function handleSendTelegram(memberId: number) {
  if (!selectedMeeting.value) return
  loading.value = true
  try {
    const res = await api.post('/' + selectedMeeting.value.id + '/invitations/send-telegram/' + memberId)
    showToast(res.data?.message || 'បានផ្ញើតាម Telegram', 'success')
  } catch (err: any) {
    const msg = err.response?.data?.message || 'ផ្ញើ Telegram មិនបានជោគជ័យ'
    showToast(msg, 'error')
  } finally {
    loading.value = false
  }
}

async function handleSendTelegramAll() {
  if (!selectedMeeting.value) return
  loading.value = true
  try {
    const res = await api.post('/' + selectedMeeting.value.id + '/invitations/send-telegram-all')
    showToast(res.data?.message || 'បានផ្ញើតាម Telegram ទាំងអស់', 'success')
  } catch (err: any) {
    const msg = err.response?.data?.message || 'ផ្ញើ Telegram មិនបានជោគជ័យ'
    showToast(msg, 'error')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flag-bar">
    <div class="flag-stripe blue-top" /><div class="flag-stripe red" /><div class="flag-stripe blue-bottom" />
  </div>

  <div class="page-wrap">
    <header class="page-header">
      <button class="back-btn" type="button" @click="goBack">
        <ArrowLeft :size="20" :stroke-width="2.5" /> ត្រឡប់
      </button>
      <div class="header-center">
        <div class="header-icon"><Send :size="22" :stroke-width="2" /></div>
        <h1 class="header-title">គ្រប់គ្រងការអញ្ជើញ</h1>
      </div>
    </header>

    <!-- Toast notification -->
    <div v-if="toast" :class="['toast', toast.type]">{{ toast.msg }}</div>

    <div class="layout">
      <!-- Meeting sidebar -->
      <aside class="meeting-sidebar">
        <h2 class="sidebar-title">កិច្ចប្រជុំ</h2>
        <div class="meeting-list">
          <button
            v-for="m in meetings"
            :key="m.id"
            :class="['meeting-card', { active: selectedMeeting?.id === m.id }]"
            type="button"
            @click="selectMeetingFn(m.id)"
          >
            <strong class="mc-title">{{ m.title }}</strong>
            <div class="mc-meta">
              <span><Calendar :size="12" /> {{ formatDate(m.date) }}</span>
              <span><Clock :size="12" /> {{ m.startTime }} - {{ m.endTime }}</span>
              <span><MapPin :size="12" /> {{ m.venue }}</span>
            </div>
            <div class="mc-stats">
              <span><Users :size="12" /> {{ m.participantCount }} នាក់</span>
              <span v-if="m.checkedInCount > 0" class="stat-checked">✓ {{ m.checkedInCount }} បានចូល</span>
            </div>
          </button>
        </div>
      </aside>

      <!-- Main content -->
      <main class="main-content">
        <template v-if="selectedMeeting">
          <div class="toolbar">
            <div class="toolbar-left">
              <h2>{{ selectedMeeting.objective }}</h2>
              <span class="meeting-date">{{ formatDate(selectedMeeting.date) }} · {{ formatTimeRange(selectedMeeting.startTime || selectedMeeting.start, selectedMeeting.endTime || selectedMeeting.end) }}</span>
            </div>
            <div class="toolbar-actions">
              <span class="badge-count">{{ invitations.length }} អ្នកចូលរួម</span>
              <span class="badge-sent">{{ sentCount }} បានផ្ញើ</span>
              <span class="badge-checkin">{{ checkedInCount }} បានចូល</span>
              <button class="btn-gen" type="button" :disabled="allCodesGenerated" @click="handleGenerateCodes">
                <RefreshCw :size="15" :class="{ spinning: loading }" /> បង្កើតលេខកូដទាំងអស់
              </button>
              <button v-if="allCodesGenerated" class="btn-copy-all" type="button" @click="copyAllCodes">
                <Copy :size="15" /> ចម្លងទាំងអស់
              </button>
              <button
                v-if="hasUnsent"
                class="btn-send-all"
                type="button"
                :disabled="loading"
                @click="handleSendAll"
              >
                <Send :size="15" /> ផ្ញើអ៊ីមែលទាំងអស់
              </button>
              <button
                class="btn-send-telegram-all"
                type="button"
                :disabled="loading"
                @click="handleSendTelegramAll"
              >
                <SendHorizontal :size="15" /> Telegram ទាំងអស់
              </button>
            </div>
          </div>

          <div class="table-wrap">
            <table class="inv-table">
              <thead>
                <tr>
                  <th>ឈ្មោះ</th>
                  <th>តួនាទី</th>
                  <th>ទំនាក់ទំនង</th>
                  <th>លេខកូដ</th>
                  <th>ស្ថានភាព</th>
                  <th>សកម្មភាព</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="inv in invitations" :key="inv.id">
                  <td class="td-name"><strong>{{ inv.name }}</strong></td>
                  <td class="td-pos">{{ inv.role }}</td>
                  <td class="td-contact">
                    <span v-if="inv.email" class="contact-link" title="ផ្ញើអ៊ីមែល">{{ inv.email }}</span>
                    <span v-if="inv.telegram" class="contact-tg" title="Telegram">{{ inv.telegram }}</span>
                  </td>
                  <td class="td-code">
                    <template v-if="inv.unique_code">
                      <code class="code-text">{{ inv.unique_code }}</code>
                      <button class="btn-icon" type="button" title="ចម្លងលេខកូដ" @click="copyCode(inv.unique_code, inv.id)">
                        <CheckCheck v-if="copiedId === inv.id" :size="14" class="icon-copied" />
                        <Copy v-else :size="14" />
                      </button>
                    </template>
                    <span v-else class="no-code">—</span>
                  </td>
                  <td class="td-status">
                    <span v-if="inv.invitation_sent" class="status-sent">បានផ្ញើ</span>
                    <span v-else class="status-pending">មិនទាន់ផ្ញើ</span>
                    <span v-if="inv.checked_in" class="status-checkedin">បានចូលរួម</span>
                  </td>
                  <td class="td-actions">
                    <button
                      v-if="!inv.invitation_sent"
                      class="btn-action"
                      type="button"
                      :disabled="!inv.unique_code"
                      :title="inv.unique_code ? 'ផ្ញើការអញ្ជើញតាមអ៊ីមែល' : 'សូមបង្កើតលេខកូដជាមុន'"
                      @click="handleSendInvitation(inv.id)"
                    >
                      <Mail :size="14" /> អ៊ីមែល
                    </button>
                    <button
                      v-if="!inv.invitation_sent"
                      class="btn-action telegram"
                      type="button"
                      :disabled="!inv.unique_code"
                      :title="'ផ្ញើតាម Telegram'"
                      @click="handleSendTelegram(inv.id)"
                    >
                      <SendHorizontal :size="14" /> Telegram
                    </button>
                    <button
                      v-else
                      class="btn-action unsent"
                      type="button"
                      title="សម្គាល់ថាមិនទាន់ផ្ញើ"
                      @click="handleMarkSent(inv.id)"
                    >
                      មិនទាន់ផ្ញើ
                    </button>
                  </td>
                </tr>
                <tr v-if="invitations.length === 0">
                  <td colspan="6" class="empty-row">មិនមានអ្នកចូលរួម</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>

        <div v-else class="no-meeting">សូមជ្រើសរើសកិច្ចប្រជុំ</div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.flag-bar { position: fixed; top: 0; left: 0; right: 0; z-index: 200; display: flex; flex-direction: column; height: 6px; }
.flag-stripe.blue-top { height: 2px; background: #032ea1; }
.flag-stripe.red { height: 2px; background: #e00025; }
.flag-stripe.blue-bottom { height: 2px; background: #032ea1; }

.page-wrap { width: 100%; min-height: 100vh; padding: 8px 24px 48px; }
.page-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 24px 0 20px; border-bottom: 1px solid var(--color-border-soft); margin-bottom: 20px; }
.back-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; font-size: 14px; font-weight: 600; color: var(--color-primary); background: rgba(255,255,255,0.8); border: 1px solid var(--color-border); border-radius: 10px; cursor: pointer; }
.back-btn:hover { background: #fff; border-color: var(--color-primary); }
.header-center { display: flex; align-items: center; gap: 10px; }
.header-icon { display: grid; place-items: center; width: 40px; height: 40px; color: var(--color-primary); background: rgba(13,98,213,0.08); border-radius: 10px; }
.header-title { margin: 0; font-family: var(--font-heading); font-size: 20px; font-weight: 700; color: var(--color-text); }

.toast { position: fixed; top: 20px; right: 20px; z-index: 999; padding: 12px 20px; border-radius: 10px; font-size: 14px; font-weight: 600; box-shadow: 0 4px 20px rgba(0,0,0,0.12); }
.toast.success { color: #15803d; background: #f0fdf4; border: 1px solid #bbf7d0; }
.toast.error { color: #b91c1c; background: #fef2f2; border: 1px solid #fecaca; }

.layout { display: flex; gap: 20px; min-height: 500px; }

/* Sidebar */
.meeting-sidebar { width: 400px; flex-shrink: 0; }
.sidebar-title { margin: 0 0 12px; font-family: var(--font-heading); font-size: 16px; color: var(--color-text); }
.meeting-list { display: grid; gap: 8px; }
.meeting-card { text-align: left; padding: 14px 16px; border: 1px solid var(--color-border-soft); border-radius: 12px; background: rgba(255,255,255,0.6); cursor: pointer; transition: all var(--transition); }
.meeting-card:hover, .meeting-card.active { border-color: var(--color-primary); background: rgba(13,98,213,0.03); }
.mc-title { display: block; font-size: 14px; line-height: 1.4; margin-bottom: 6px; color: var(--color-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mc-meta { display: grid; gap: 3px; font-size: 11px; color: var(--color-text-secondary); margin-bottom: 6px; }
.mc-meta span { display: flex; align-items: center; gap: 4px; }
.mc-stats { display: flex; gap: 10px; font-size: 11px; color: var(--color-text-secondary); }
.stat-checked { color: #15803d; font-weight: 700; }

/* Main */
.main-content { flex: 1; min-width: 0; }
.toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px 18px; background: rgba(255,255,255,0.7); border: 1px solid var(--color-border-soft); border-radius: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.toolbar-left h2 { margin: 0; font-size: 17px; font-family: var(--font-heading); color: var(--color-text); }
.meeting-date { font-size: 12px; color: var(--color-text-secondary); }
.toolbar-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.badge-count, .badge-sent, .badge-checkin { padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; }
.badge-count { color: var(--color-primary); background: rgba(13,98,213,0.08); }
.badge-sent { color: #15803d; background: #f0fdf4; }
.badge-checkin { color: #a16207; background: #fef9c3; }

.btn-gen { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; font-size: 13px; font-weight: 700; color: #fff; background: var(--color-primary); border: none; border-radius: 8px; cursor: pointer; }
.btn-gen:disabled { opacity: 0.5; cursor: default; }
.btn-copy-all { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; font-size: 13px; font-weight: 600; color: var(--color-primary); background: rgba(13,98,213,0.06); border: 1px solid rgba(13,98,213,0.2); border-radius: 8px; cursor: pointer; }
.btn-send-all { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; font-size: 13px; font-weight: 700; color: #fff; background: #16a34a; border: none; border-radius: 8px; cursor: pointer; }
.btn-send-all:hover { background: #15803d; }
.btn-send-all:disabled { opacity: 0.5; cursor: default; }
.btn-send-telegram-all { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; font-size: 13px; font-weight: 700; color: #fff; background: #26a5e4; border: none; border-radius: 8px; cursor: pointer; }
.btn-send-telegram-all:hover { background: #1e8fc7; }
.btn-send-telegram-all:disabled { opacity: 0.5; cursor: default; }
.btn-action.telegram { color: #fff; background: #26a5e4; }
.btn-action.telegram:hover { background: #1e8fc7; }
.spinning { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Table */
.table-wrap { overflow-x: auto; border: 1px solid var(--color-border-soft); border-radius: 12px; background: rgba(255,255,255,0.8); }
.inv-table { width: 100%; border-collapse: collapse; font-size: 13px; table-layout: fixed; }
.inv-table th { padding: 12px 10px; text-align: left; font-size: 11px; font-weight: 700; color: var(--color-text-secondary); background: #f8fafc; border-bottom: 1px solid var(--color-border-soft); white-space: nowrap; }
.inv-table td { padding: 10px; border-bottom: 1px solid var(--color-border-soft); vertical-align: middle; word-break: break-word; }
.inv-table tr:last-child td { border-bottom: 0; }
.inv-table tr:hover { background: rgba(13,98,213,0.015); }

/* Column widths */
.inv-table th:nth-child(1),
.inv-table td:nth-child(1) { width: 20%; }
.inv-table th:nth-child(2),
.inv-table td:nth-child(2) { width: 12%; }
.inv-table th:nth-child(3),
.inv-table td:nth-child(3) { width: 18%; }
.inv-table th:nth-child(4),
.inv-table td:nth-child(4) { width: 18%; }
.inv-table th:nth-child(5),
.inv-table td:nth-child(5) { width: 14%; }
.inv-table th:nth-child(6),
.inv-table td:nth-child(6) { width: 18%; }

.td-name strong { font-size: 13px; color: var(--color-text); }
.td-pos { color: var(--color-text-secondary); font-size: 12px; }
.td-contact { flex-direction: column; gap: 2px; }
.contact-link { color: var(--color-primary); font-size: 12px; text-decoration: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block; }
.contact-link:hover { text-decoration: underline; }
.contact-tg { color: #26a5e4; font-size: 11px; }

.td-code { white-space: nowrap; }
.code-text { font-family: 'Courier New', monospace; font-size: 12px; font-weight: 700; color: var(--color-text); letter-spacing: 1px; padding: 2px 6px; background: #f1f5f9; border-radius: 4px; }
.btn-icon { display: inline-grid; place-items: center; width: 24px; height: 24px; margin-left: 4px; border: none; border-radius: 6px; background: transparent; cursor: pointer; color: var(--color-text-secondary); vertical-align: middle; }
.btn-icon:hover { background: #f1f5f9; }
.icon-copied { color: #22c55e; }
.btn-sm { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; font-size: 11px; font-weight: 600; color: var(--color-primary); background: rgba(13,98,213,0.06); border: 1px solid rgba(13,98,213,0.2); border-radius: 6px; cursor: pointer; }

.td-status { flex-direction: column; gap: 4px; }
.status-sent { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; color: #15803d; background: #f0fdf4; }
.status-pending { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; color: #a16207; background: #fef9c3; }
.status-checkedin { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; color: var(--color-primary); background: rgba(13,98,213,0.08); }

.td-actions { white-space: nowrap; gap: 6px; align-items: center; flex-wrap: wrap; }
.btn-action { display: inline-flex; margin-right: 5px; align-items: center; float: right; gap: 4px; padding: 6px 10px; font-size: 11px; font-weight: 600; color: #fff; background: var(--color-primary); border: none; border-radius: 6px; cursor: pointer; white-space: nowrap; }
.btn-action:disabled { opacity: 0.4; cursor: default; }
.btn-action.unsent { color: var(--color-text-secondary); background: #f1f5f9; border: 1px solid var(--color-border); }

.empty-row { text-align: center; padding: 40px !important; color: var(--color-text-secondary); }
.no-meeting { text-align: center; padding: 60px; color: var(--color-text-secondary); }
.no-code { color: var(--color-text-secondary); font-size: 13px; }

@media (max-width: 900px) {
  .layout { flex-direction: column; }
  .meeting-sidebar { width: 100%; }
  .meeting-list { display: flex; overflow-x: auto; gap: 8px; padding-bottom: 8px; }
  .meeting-card { min-width: 240px; flex-shrink: 0; }
  .toolbar { flex-direction: column; align-items: flex-start; }
}
@media (max-width: 640px) {
  .page-wrap { padding: 8px 16px 48px; }
  .page-header { flex-direction: column; align-items: flex-start; }
  .header-title { font-size: 18px; }
  .inv-table td, .inv-table th { padding: 10px; }
}
</style>
