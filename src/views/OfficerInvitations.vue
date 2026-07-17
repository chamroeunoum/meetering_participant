<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/utils/api'
import { formatDate, formatTimeRange } from '@/utils/data'
import {
  ArrowLeft, Mail, Copy, CheckCheck, RefreshCw, Send, SendHorizontal, Calendar, Clock, MapPin, Phone, Users, QrCode,
} from 'lucide-vue-next'

import QRCode from 'qrcode'

const router = useRouter()

// QR modal
const showQrModal = ref(false)
const qrMeeting = ref<any>(null)
const qrDataUrl = ref('')
const qrCheckinUrl = ref('')

async function showQrForMeeting(m: any, event: Event) {
  event.stopPropagation()
  qrMeeting.value = m
  const origin = window.location.origin
  const url = origin + '/checkin?code=' + encodeURIComponent(m.meeting_code)
  qrCheckinUrl.value = url
  showQrModal.value = true
  await buildQrPrintImage(m, url)
}

async function buildQrPrintImage(m: any, url: string) {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  const w = 800, h = 1100
  canvas.width = w
  canvas.height = h

  // ── White background ──
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, w, h)

  // ── Decorative border (black) ──
  const mg = 24
  ctx.save()
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = 2.5
  ctx.strokeRect(mg, mg, w - mg * 2, h - mg * 2)
  ctx.strokeStyle = '#999999'
  ctx.lineWidth = 1
  ctx.setLineDash([8, 5])
  ctx.strokeRect(mg + 10, mg + 10, w - mg * 2 - 20, h - mg * 2 - 20)
  ctx.setLineDash([])
  const cs = 14
  const corners = [[mg+5,mg+5],[w-mg-5,mg+5],[mg+5,h-mg-5],[w-mg-5,h-mg-5]]
  ctx.fillStyle = '#000000'
  for (const [cx, cy] of corners) {
    ctx.beginPath()
    ctx.moveTo(cx, cy - cs); ctx.lineTo(cx + cs, cy)
    ctx.lineTo(cx, cy + cs); ctx.lineTo(cx - cs, cy)
    ctx.closePath(); ctx.fill()
  }
  ctx.restore()

  // ── Load logo for watermark ──
  try {
    const logoUrl = (await import('@/assets/logo.svg')).default
    const logoImg = new Image()
    await new Promise((resolve, reject) => { logoImg.onload = resolve; logoImg.onerror = reject; logoImg.src = logoUrl })
    ctx.save()
    ctx.globalAlpha = 0.035
    ctx.drawImage(logoImg, (w - 400) / 2, (h - 400) / 2, 400, 400)
    ctx.restore()
  } catch { /* watermark unavailable */ }

  // ── Date top-right (YmdHis) ──
  const now = new Date()
  const dateStr = String(now.getFullYear()) +
    String(now.getMonth()+1).padStart(2,'0') +
    String(now.getDate()).padStart(2,'0') +
    String(now.getHours()).padStart(2,'0') +
    String(now.getMinutes()).padStart(2,'0') +
    String(now.getSeconds()).padStart(2,'0')
  ctx.fillStyle = 'rgba(0,0,0,0.12)'
  ctx.font = '11px Inter, sans-serif'
  ctx.textAlign = 'right'
  ctx.fillText(dateStr, w - mg - 14, mg + 32)

  // ── Word-wrap objective ──
  const obj = m.objective || m.title || ''
  ctx.font = 'bold 24px "Noto Sans Khmer", Inter, sans-serif'
  const maxTW = w - 80
  const objLines: string[] = []
  let line = ''
  for (const char of obj) {
    const test = line + char
    if (ctx.measureText(test).width > maxTW) { objLines.push(line); line = char }
    else line = test
  }
  if (line) objLines.push(line)

  // ── Intro text (fixed at top-left) ──
  ctx.fillStyle = '#000000'
  ctx.font = 'bold 22px Inter, "Noto Sans Khmer", sans-serif'
  ctx.textAlign = 'left'
  ctx.fillText('ចុះឈ្មោះចូលរួមកិច្ចប្រជុំ', mg + 28, mg + 56)
  ctx.font = '16px Inter, "Noto Sans Khmer", sans-serif'
  ctx.fillStyle = '#444444'
  ctx.fillText('ស្កេន QR ខាងក្រោមដើម្បីចុះឈ្មោះចូលរួម', mg + 28, mg + 86)

  // ── Vertically center rest of content ──
  const qrSize = 320
  const codeH = 40
  const objLineH = 34
  const objH = objLines.length * objLineH
  const totalH = qrSize + 20 + codeH + 14 + objH
  const startY = (h - totalH) / 2 + 20

  // ── QR Code ──
  const qrData = await QRCode.toDataURL(url, { width: 340, margin: 2, color: { dark: '#000000', light: '#FFFFFF' } })
  const qrImg = new Image()
  await new Promise((resolve) => { qrImg.onload = resolve; qrImg.src = qrData })
  const qrX = (w - qrSize) / 2
  const qrY = startY
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.roundRect(qrX - 8, qrY - 8, qrSize + 16, qrSize + 16, 10)
  ctx.fill()
  ctx.strokeStyle = '#CCCCCC'
  ctx.lineWidth = 1
  ctx.stroke()
  ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize)

  // ── Meeting code ──
  const codeY = qrY + qrSize + 20
  ctx.fillStyle = '#000000'
  ctx.font = 'bold 36px "Courier New", monospace'
  ctx.textAlign = 'center'
  ctx.fillText(m.meeting_code || '', w / 2, codeY + codeH - 4)

  // ── Objective ──
  ctx.fillStyle = '#000000'
  ctx.font = 'bold 24px "Noto Sans Khmer", Inter, sans-serif'
  ctx.textAlign = 'center'
  let oy = codeY + codeH + 14 + 26
  for (const l of objLines) { ctx.fillText(l, w / 2, oy); oy += objLineH }

  // ── Bottom OCM title ──
  ctx.fillStyle = '#000000'
  ctx.font = 'bold 16px Inter, "Noto Sans Khmer", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('ទីស្ដីការគណៈរដ្ឋមន្ត្រី · Office of the Council of Ministers', w / 2, h - mg - 16)

  qrDataUrl.value = canvas.toDataURL('image/jpeg', 0.95)
}
function downloadQr() {
  if (!qrDataUrl.value) return
  const link = document.createElement('a')
  link.download = (qrMeeting.value?.meeting_code || 'qrcode') + '.png'
  link.href = qrDataUrl.value
  link.click()
}

function copyQrUrl() {
  if (!qrCheckinUrl.value) return
  navigator.clipboard.writeText(qrCheckinUrl.value)
  showToast('បានចម្លងតំណ', 'success')
}

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
            <strong class="mc-title">{{ m.title || m.objective }}</strong>
            <div v-if="m.meeting_code" class="mc-code-row">
              <span class="mc-code">{{ m.meeting_code }}</span>
            </div>
            <div class="mc-meta">
              <span><Calendar :size="12" /> {{ formatDate(m.date) }} · <Clock :size="12" /> {{ m.startTime }} - {{ m.endTime }}</span>
              <span>
                <template v-if="m.venue && (m.venue.includes('ទូរស័ព្ទ') || m.venue.includes('@'))">
                  <div class="mc-contact-line"><Phone :size="12" /> {{ m.venue.split('|')[0]?.replace(/ទូរស័ព្ទ:\s*/i, '').trim() }}</div>
                  <div class="mc-contact-line"><Mail :size="12" /> {{ m.venue.split('|')[1]?.replace(/អ៊ីមែល:\s*/i, '').trim() }}</div>
                </template>
                <template v-else>
                  <MapPin :size="12" /> {{ m.venue }}
                </template>
              </span>
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
              <div class="meeting-meta">
                <span class="meeting-code-badge" v-if="selectedMeeting.meeting_code">{{ selectedMeeting.meeting_code }}</span>
                <span class="meeting-date">{{ formatDate(selectedMeeting.date) }} · {{ formatTimeRange(selectedMeeting.startTime || selectedMeeting.start, selectedMeeting.endTime || selectedMeeting.end) }}</span>
              </div>
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
              <button v-if="selectedMeeting?.meeting_code" class="btn-gen btn-qr" type="button" @click="showQrForMeeting(selectedMeeting, $event)">
                <QrCode :size="15" /> QR បោះពុម្ព
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

  <!-- QR Modal -->
  <Teleport to="body">
    <div v-if="showQrModal" class="qr-overlay" @click.self="showQrModal = false">
      <div class="qr-modal">
        <button class="qr-modal-close" type="button" @click="showQrModal = false">✕</button>
        <h3 class="qr-modal-title">QR សម្រាប់បោះពុម្ព</h3>
        <p class="qr-modal-sub" v-if="qrMeeting">{{ qrMeeting.meeting_code }} · {{ qrMeeting.objective || qrMeeting.title }}</p>
        <div class="qr-image-wrap">
          <img v-if="qrDataUrl" :src="qrDataUrl" alt="QR Code" class="qr-image" />
          <div v-else class="qr-loading">កំពុងបង្កើត...</div>
        </div>
        <div class="qr-actions">
          <button class="btn btn-primary" type="button" @click="downloadQr">ទាញយក PNG</button>
          <button class="btn btn-secondary" type="button" @click="copyQrUrl">ចម្លងតំណ</button>
        </div>
      </div>
    </div>
  </Teleport>
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
.meeting-sidebar { width: 400px; min-width: 400px; max-width: 400px; flex-shrink: 0; }
.sidebar-title { margin: 0 0 12px; font-family: var(--font-heading); font-size: 16px; color: var(--color-text); }
.meeting-list { display: grid; gap: 8px; }
.meeting-card { width: 400px; min-width: 400px; max-width: 400px; text-align: left; padding: 14px 16px; border: 1px solid var(--color-border-soft); border-radius: 12px; background: rgba(255,255,255,0.6); cursor: pointer; transition: all var(--transition); box-sizing: border-box; }
.meeting-card:hover, .meeting-card.active { border-color: var(--color-primary); background: rgba(13,98,213,0.03); }
.mc-title { display: block; font-size: 14px; line-height: 1.4; margin-bottom: 6px; color: var(--color-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.mc-code-row { margin-bottom: 6px; }
.mc-code { font-size: 12px; font-weight: 700; color: var(--color-text-secondary); font-family: 'Courier New', monospace; }
.mc-meta { display: grid; gap: 3px; font-size: 11px; color: var(--color-text-secondary); margin-bottom: 6px; }
.mc-meta span { display: flex; align-items: center; gap: 4px; }
.mc-contact-line { display: flex; align-items: center; gap: 4px; margin-top: 4px; margin-right: 4px; }
.mc-stats { display: flex; gap: 10px; font-size: 11px; color: var(--color-text-secondary); margin-bottom: 4px; margin-left: 4px; align-items: center; }
.btn-qr { background: #0D62D5; margin-left: 4px; }
.stat-checked { color: #15803d; font-weight: 700; }

/* Main */
.main-content { flex: 1; min-width: 0; }
.toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 16px 18px; background: rgba(255,255,255,0.7); border: 1px solid var(--color-border-soft); border-radius: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.toolbar-left h2 { margin: 0; font-size: 17px; font-family: var(--font-heading); color: var(--color-text); }
.meeting-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.meeting-code-badge { display: inline-block; padding: 2px 8px; font-size: 11px; font-weight: 800; letter-spacing: 0.5px; color: #fff; background: var(--color-primary); border-radius: 999px; font-family: 'Courier New', monospace; }
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

/* QR Modal */
.qr-overlay { position: fixed; inset: 0; z-index: 9999; display: grid; place-items: center; background: rgba(0,0,0,0.5); padding: 24px; }
.qr-modal { background: #fff; border-radius: 20px; padding: 24px; max-width: 560px; width: 100%; text-align: center; box-shadow: 0 20px 60px rgba(0,0,0,0.15); position: relative; max-height: 90vh; display: flex; flex-direction: column; }
.qr-modal-close { position: absolute; top: 12px; right: 16px; border: none; background: none; font-size: 20px; color: var(--color-text-secondary); cursor: pointer; z-index: 1; }
.qr-modal-title { margin: 0 0 4px; font-family: var(--font-heading); font-size: 18px; color: var(--color-text); }
.qr-modal-sub { font-size: 13px; color: var(--color-text-secondary); margin: 0 0 16px; }
.qr-image-wrap { display: grid; place-items: center; margin: 0 auto 16px; overflow: hidden; flex: 1; min-height: 0; }
.qr-image { max-width: 100%; max-height: 60vh; width: auto; height: auto; border: 1px solid var(--color-border); border-radius: 8px; object-fit: contain; }
.qr-loading { width: 200px; height: 200px; display: grid; place-items: center; color: var(--color-text-secondary); font-size: 14px; }
.qr-actions { display: flex; gap: 10px; justify-content: center; }
.qr-actions .btn { min-height: 38px; padding: 6px 20px; font-size: 13px; }
</style>
