<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePortalStore } from '@/stores/portal'
import participantApi from '@/utils/participantApi'
import { QrCode, KeyRound, ArrowLeft, CheckCircle, XCircle, Loader2, ChevronRight } from 'lucide-vue-next'

interface MemberItem {
  member_id: number
  people_id: number
  name: string
  avatar: string
  role: string
  has_invitation: boolean
  checked_in: boolean
}

const route = useRoute()
const router = useRouter()
const portalStore = usePortalStore()

type Step = 'input' | 'select-person' | 'verify-code' | 'done'
const step = ref<Step>('input')

// Mode: 'scan' | 'manual'
const mode = ref<'scan' | 'manual'>('scan')
const codeInput = ref('')
const submitting = ref(false)

// QR scanner
let html5QrCode: any = null

// Meeting data
const meetingInfo = ref<any>(null)
const members = ref<MemberItem[]>([])
const selectedMember = ref<MemberItem | null>(null)
const inviteCodeInput = ref('')
const inviteCodeError = ref('')

// Result toast
const scanResult = ref<'idle' | 'success' | 'error'>('idle')
const resultMessage = ref('')

async function loadQrScanner() {
  try {
    const { Html5Qrcode } = await import('html5-qrcode')
    html5QrCode = new Html5Qrcode('qr-reader')
    await html5QrCode.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText: string) => { handleCode(decodedText) },
      () => { /* ignore partial scans */ }
    )
  } catch {
    mode.value = 'manual'
  }
}

function stopScanner() {
  if (html5QrCode) {
    try { html5QrCode.stop() } catch { /* ignore */ }
    try { html5QrCode.clear() } catch { /* ignore */ }
    html5QrCode = null
  }
}

function getAvatarColor(name: string): string {
  const colors = ['#0D62D5', '#D4AF37', '#22C55E', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

// ─── Handle code input (scan or manual) ───────────────────────────
async function handleCode(code: string) {
  if (submitting.value) return
  const trimmed = code.trim().toUpperCase()
  if (!trimmed) return

  submitting.value = true
  scanResult.value = 'idle'
  stopScanner()

  try {
    const res = await participantApi.post('/checkin/verify', { code: trimmed })
    const data = res.data

    if (!data.success) {
      scanResult.value = 'error'
      resultMessage.value = data.message || 'លេខកូដមិនត្រឹមត្រូវ'
      return
    }

    const codeType = data.code_type || 'meeting'

    if (codeType === 'personal') {
      // Personal code → auto check-in, go to meeting
      portalStore.grantAccess(trimmed)
      const meetingId = data.data?.meeting_id || ''
      if (meetingId) {
        portalStore.markCheckIn(meetingId)
      }
      scanResult.value = 'success'
      resultMessage.value = data.message || 'បានចុះឈ្មោះចូលរួមដោយជោគជ័យ!'
      setTimeout(() => {
        if (meetingId) router.push('/meeting-viewer?id=' + meetingId + '&code=' + encodeURIComponent(trimmed))
      }, 1500)
    } else {
      // Meeting code → show participant list
      meetingInfo.value = data.data
      members.value = data.data?.members || []
      step.value = 'select-person'
    }
  } catch {
    scanResult.value = 'error'
    resultMessage.value = 'មិនអាចផ្ទៀងផ្ទាត់លេខកូដបានទេ'
  } finally {
    submitting.value = false
  }
}

// ─── Select a participant from the list ──────────────────────────
function selectPerson(member: MemberItem) {
  if (!member.has_invitation) return
  selectedMember.value = member
  inviteCodeInput.value = ''
  inviteCodeError.value = ''
  step.value = 'verify-code'
}

// ─── Verify invitation code for the selected person ──────────────
async function confirmInviteCode() {
  const code = inviteCodeInput.value.trim().toUpperCase()
  if (!code) {
    inviteCodeError.value = 'សូមបញ្ចូលលេខកូដអញ្ជើញ'
    return
  }

  submitting.value = true
  inviteCodeError.value = ''

  try {
    const res = await participantApi.post('/checkin/verify', { code })
    const data = res.data

    if (!data.success) {
      inviteCodeError.value = data.message || 'លេខកូដមិនត្រឹមត្រូវ'
      return
    }

    // Verify this invitation code belongs to the selected person
    const person = data.data?.participant_name || ''
    if (person && !selectedMember.value?.name.includes(person)) {
      inviteCodeError.value = 'លេខកូដនេះមិនមែនជារបស់អ្នកចូលរួមដែលបានជ្រើសរើសទេ។'
      return
    }

    const meetingId = data.data?.meeting_id || meetingInfo.value?.meeting_id || ''
    portalStore.grantAccess(code)
    if (meetingId) {
      portalStore.markCheckIn(meetingId)
    }

    step.value = 'done'
    scanResult.value = 'success'
    resultMessage.value = 'បានចុះឈ្មោះចូលរួមដោយជោគជ័យ!'

    setTimeout(() => {
      if (meetingId) router.push('/meeting-viewer?id=' + meetingId + '&code=' + encodeURIComponent(code))
    }, 1500)
  } catch {
    inviteCodeError.value = 'លេខកូដផ្ទៀងផ្ទាត់មិនត្រឹមត្រូវ'
  } finally {
    submitting.value = false
  }
}

async function handleManualSubmit() {
  await handleCode(codeInput.value)
}

function switchMode(m: 'scan' | 'manual') {
  mode.value = m
  scanResult.value = 'idle'
  resultMessage.value = ''
  codeInput.value = ''
  if (m === 'scan') loadQrScanner()
  else stopScanner()
}

function goBack() {
  stopScanner()
  if (step.value === 'select-person') { step.value = 'input'; meetingInfo.value = null; members.value = []; return }
  if (step.value === 'verify-code') { step.value = 'select-person'; selectedMember.value = null; return }
  router.push('/')
}

// Auto-process code from URL query param (from QR scan)
onMounted(() => {
  const codeParam = route.query.code as string
  if (codeParam) {
    mode.value = 'manual'
    codeInput.value = codeParam
    handleCode(codeParam)
  } else {
    loadQrScanner()
  }
})

onUnmounted(() => { stopScanner() })
</script>

<template>
  <div class="flag-bar">
    <div class="flag-stripe blue-top" /><div class="flag-stripe red" /><div class="flag-stripe blue-bottom" />
  </div>

  <div class="checkin-page">
    <div class="checkin-card">
      <!-- Header -->
      <div class="card-header-bar">
        <button class="back-btn" type="button" @click="goBack">
          <ArrowLeft :size="18" :stroke-width="2.5" />
        </button>
        <h1>{{ step === 'select-person' ? 'ជ្រើសរើសអ្នកចូលរួម' : step === 'verify-code' ? 'បញ្ជាក់អត្តសញ្ញាណ' : 'ចុះឈ្មោះចូលរួម' }}</h1>
        <div class="spacer" />
      </div>

      <!-- Step 1: Code input -->
      <template v-if="step === 'input'">
        <div class="mode-tabs">
          <button :class="['mode-tab', { active: mode === 'scan' }]" type="button" @click="switchMode('scan')">
            <QrCode :size="18" /> ស្កេន QR
          </button>
          <button :class="['mode-tab', { active: mode === 'manual' }]" type="button" @click="switchMode('manual')">
            <KeyRound :size="18" /> បញ្ចូលលេខកូដ
          </button>
        </div>

        <div v-show="mode === 'scan'" class="scanner-section">
          <div id="qr-reader" class="qr-reader" />
          <p class="hint">សូមដាក់ QR កូដកិច្ចប្រជុំ ឬកូដអញ្ជើញនៅពីមុខកាមេរ៉ា</p>
        </div>

        <div v-show="mode === 'manual'" class="manual-section">
          <form @submit.prevent="handleManualSubmit">
            <div class="field">
              <label for="code">បញ្ចូលលេខកូដ</label>
              <input id="code" v-model="codeInput" type="text" placeholder="ឧ. MTG-A7K3 ឬ OCM-X9F2" maxlength="20" class="code-input" autocomplete="off" required />
            </div>
            <button class="submit-btn" type="submit" :disabled="submitting || !codeInput.trim()">
              <Loader2 v-if="submitting" :size="18" class="spinner" />
              <CheckCircle v-else :size="18" />
              {{ submitting ? 'កំពុងផ្ទៀងផ្ទាត់...' : 'ផ្ទៀងផ្ទាត់' }}
            </button>
          </form>
        </div>

        <div v-if="scanResult !== 'idle'" :class="['result-toast', scanResult]">
          <CheckCircle v-if="scanResult === 'success'" :size="20" />
          <XCircle v-else :size="20" />
          <span>{{ resultMessage }}</span>
        </div>
      </template>

      <!-- Step 2: Select person from list -->
      <template v-if="step === 'select-person'">
        <div class="meeting-badge">
          <span class="meeting-badge-code">{{ meetingInfo?.meeting_code }}</span>
          <span class="meeting-badge-title">{{ meetingInfo?.meeting_objective }}</span>
        </div>
        <p class="select-hint">សូមជ្រើសរើសឈ្មោះរបស់អ្នកក្នុងបញ្ជីខាងក្រោម</p>
        <div class="members-grid">
          <button
            v-for="member in members"
            :key="member.member_id"
            :class="['member-card', { disabled: !member.has_invitation, checked: member.checked_in }]"
            type="button"
            :disabled="!member.has_invitation || member.checked_in"
            @click="selectPerson(member)"
          >
            <div class="member-avatar" :style="{ background: getAvatarColor(member.name) }">{{ member.avatar }}</div>
            <div class="member-info">
              <strong>{{ member.name }}</strong>
              <span>{{ member.role === 'leader' ? 'ប្រធាន' : member.role === 'deputy_leader' ? 'អនុប្រធាន' : 'សមាជិក' }}</span>
            </div>
            <div v-if="member.checked_in" class="member-checked"><CheckCircle :size="18" /></div>
            <div v-else-if="member.has_invitation" class="member-arrow"><ChevronRight :size="18" /></div>
          </button>
          <div v-if="members.length === 0" class="empty-members"><p>មិនទាន់មានអ្នកចូលរួម</p></div>
        </div>
      </template>

      <!-- Step 3: Enter invitation code to confirm identity -->
      <template v-if="step === 'verify-code' && selectedMember">
        <div class="confirm-card">
          <div class="confirm-avatar" :style="{ background: getAvatarColor(selectedMember.name) }">{{ selectedMember.avatar }}</div>
          <strong class="confirm-name">{{ selectedMember.name }}</strong>
          <span class="confirm-hint">សូមបញ្ចូលលេខកូដអញ្ជើញរបស់អ្នក</span>
          <form @submit.prevent="confirmInviteCode" class="confirm-form">
            <input
              v-model="inviteCodeInput"
              type="text"
              placeholder="បញ្ចូលលេខកូដ OCM-XXX"
              maxlength="20"
              class="code-input"
              autocomplete="off"
              autofocus
            />
            <div v-if="inviteCodeError" class="access-error">{{ inviteCodeError }}</div>
            <button class="submit-btn" type="submit" :disabled="submitting || !inviteCodeInput.trim()">
              <Loader2 v-if="submitting" :size="18" class="spinner" />
              <CheckCircle v-else :size="18" />
              {{ submitting ? 'កំពុងផ្ទៀងផ្ទាត់...' : 'បញ្ជាក់' }}
            </button>
          </form>
        </div>
      </template>

      <!-- Step 4: Success -->
      <div v-if="step === 'done'" :class="['result-toast', 'success', 'done-toast']">
        <CheckCircle :size="24" />
        <span>{{ resultMessage }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.flag-bar { position: fixed; top: 0; left: 0; right: 0; z-index: 200; display: flex; flex-direction: column; height: 6px; }
.flag-stripe.blue-top { height: 2px; background: #032ea1; }
.flag-stripe.red { height: 2px; background: #e00025; }
.flag-stripe.blue-bottom { height: 2px; background: #032ea1; }

.checkin-page { display: grid; place-items: center; min-height: 100vh; padding: 24px; background: linear-gradient(135deg, #f5f8fc 0%, #e8eef5 100%); }
.checkin-card { width: 100%; max-width: 520px; background: #fff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
.card-header-bar { display: flex; align-items: center; gap: 12px; padding: 20px 24px 0; }
.card-header-bar h1 { margin: 0; font-family: var(--font-heading); font-size: 20px; font-weight: 700; color: var(--color-text); text-align: center; flex: 1; }
.spacer { width: 36px; }
.back-btn { display: inline-grid; place-items: center; width: 36px; height: 36px; border: 1px solid var(--color-border); border-radius: 10px; background: #fff; color: var(--color-text); cursor: pointer; flex-shrink: 0; }
.back-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }

.mode-tabs { display: flex; gap: 8px; padding: 16px 24px 0; }
.mode-tab { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px 16px; font-size: 14px; font-weight: 600; color: var(--color-text-secondary); background: #f8fafc; border: 1px solid var(--color-border); border-radius: 10px; cursor: pointer; transition: all var(--transition); }
.mode-tab.active { color: #fff; background: var(--color-primary); border-color: var(--color-primary); }
.mode-tab:hover:not(.active) { border-color: var(--color-primary); color: var(--color-primary); }

.scanner-section { padding: 24px; text-align: center; }
.qr-reader { width: 100%; max-width: 320px; margin: 0 auto; border-radius: 12px; overflow: hidden; border: 2px dashed var(--color-border); }
.hint { margin: 16px 0 0; font-size: 13px; color: var(--color-text-secondary); }

.manual-section { padding: 24px; }
.field { display: grid; gap: 8px; margin-bottom: 16px; }
.field label { font-size: 14px; font-weight: 700; color: var(--color-text); }
.code-input { width: 100%; padding: 14px 16px; font-size: 20px; font-family: 'Courier New', monospace; font-weight: 700; letter-spacing: 4px; text-align: center; text-transform: uppercase; color: var(--color-text); background: #f8fafc; border: 2px solid var(--color-border); border-radius: 12px; outline: none; transition: border-color var(--transition), box-shadow var(--transition); }
.code-input:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(13,98,213,0.1); }
.code-input::placeholder { font-size: 14px; letter-spacing: 1px; font-family: var(--font-body); color: #94a3b8; }
.submit-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 14px; font-size: 16px; font-weight: 700; color: #fff; background: var(--color-primary); border: none; border-radius: 12px; cursor: pointer; transition: background var(--transition); }
.submit-btn:hover:not(:disabled) { background: var(--color-primary-hover); }
.submit-btn:disabled { opacity: 0.5; cursor: default; }
.spinner { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.result-toast { display: flex; align-items: center; gap: 10px; padding: 14px 20px; margin: 0 24px 24px; border-radius: 12px; font-size: 14px; font-weight: 600; }
.result-toast.success { color: #15803d; background: #f0fdf4; border: 1px solid #bbf7d0; }
.result-toast.error { color: #b91c1c; background: #fef2f2; border: 1px solid #fecaca; }

.meeting-badge { display: grid; gap: 2px; margin: 16px 24px; padding: 12px 16px; background: #f0f6ff; border: 1px solid #dbe8ff; border-radius: 12px; }
.meeting-badge-code { font-size: 12px; font-weight: 700; color: var(--color-primary); letter-spacing: 1px; }
.meeting-badge-title { font-size: 14px; font-weight: 700; color: var(--color-text); }

.select-hint { margin: 0 24px 12px; font-size: 13px; color: var(--color-text-secondary); text-align: center; }

.members-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; padding: 0 24px 16px; }
.member-card { position: relative; display: grid; gap: 8px; justify-items: center; padding: 16px 12px; border: 2px solid var(--color-border); border-radius: 14px; background: #fff; cursor: pointer; transition: all var(--transition); text-align: center; }
.member-card:hover:not(:disabled) { border-color: var(--color-primary); box-shadow: 0 4px 12px rgba(13,98,213,0.1); transform: translateY(-2px); }
.member-card.disabled { opacity: 0.5; cursor: default; }
.member-card.checked { border-color: var(--color-success); background: #f0fdf4; cursor: default; }
.member-card:disabled { opacity: 0.5; cursor: default; }
.member-avatar { display: grid; place-items: center; width: 48px; height: 48px; border-radius: 50%; color: #fff; font-size: 20px; font-weight: 700; }
.member-info { display: grid; gap: 2px; }
.member-info strong { font-size: 13px; line-height: 1.2; color: var(--color-text); }
.member-info span { font-size: 11px; color: var(--color-text-secondary); }
.member-checked { position: absolute; top: -6px; right: -6px; color: var(--color-success); background: #fff; border-radius: 50%; line-height: 0; }
.member-arrow { position: absolute; bottom: 4px; right: 4px; color: var(--color-primary); }
.empty-members { grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--color-text-secondary); }

.confirm-card { display: grid; gap: 12px; justify-items: center; padding: 24px; text-align: center; }
.confirm-avatar { display: grid; place-items: center; width: 64px; height: 64px; border-radius: 50%; color: #fff; font-size: 28px; font-weight: 700; }
.confirm-name { font-size: 18px; font-weight: 700; color: var(--color-text); }
.confirm-hint { font-size: 13px; color: var(--color-text-secondary); }
.confirm-form { width: 100%; display: grid; gap: 12px; }
.access-error { font-size: 13px; color: #b91c1c; font-weight: 600; text-align: center; }

.done-toast { margin: 24px; justify-content: center; font-size: 16px; }
</style>
