<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePortalStore } from '@/stores/portal'
import participantApi from '@/utils/participantApi'
import { QrCode, KeyRound, ArrowLeft, CheckCircle, XCircle, Loader2 } from 'lucide-vue-next'

const router = useRouter()
const portalStore = usePortalStore()

// Mode: 'scan' | 'manual'
const mode = ref<'scan' | 'manual'>('scan')

// Manual code input
const codeInput = ref('')
const submitting = ref(false)

// Scan state
let html5QrCode: any = null

// Verification step
interface MemberItem {
  member_id: number
  people_id: number
  name: string
  avatar: string
  role: string
  group: string
  invitation_id: number | null
  unique_code: string | null
  checked_in: boolean
  checked_in_at: string | null
}

const step = ref<'input' | 'members' | 'done'>('input')
const meetingInfo = ref<any>(null)
const members = ref<MemberItem[]>([])
const checkedInMembers = ref<Set<number>>(new Set())

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
      (decodedText: string) => {
        handleCode(decodedText)
      },
      () => { /* ignore partial scans */ }
    )
  } catch {
    // Camera not available — fall back to manual
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

async function handleCode(code: string) {
  if (submitting.value) return
  const trimmed = code.trim()
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

    const meetingId = data.data?.meeting_id || ''
    const codeType = data.code_type || 'meeting'

    portalStore.grantAccess(trimmed)

    if (codeType === 'personal') {
      // Personal code — auto check-in
      portalStore.markCheckIn(meetingId)
      scanResult.value = 'success'
      resultMessage.value = data.message || 'បានចុះឈ្មោះចូលរួមដោយជោគជ័យ!'

      setTimeout(() => {
        if (meetingId) {
          router.push('/meeting-viewer?id=' + meetingId + '&code=' + encodeURIComponent(trimmed))
        }
      }, 1500)
    } else {
      // Meeting code — show participant thumbnails grid
      meetingInfo.value = data.data
      await fetchMembers(meetingId)
      step.value = 'members'
    }
  } catch {
    scanResult.value = 'error'
    resultMessage.value = 'មិនអាចផ្ទៀងផ្ទាត់លេខកូដបានទេ'
  } finally {
    submitting.value = false
  }
}

async function fetchMembers(meetingId: string) {
  try {
    const res = await participantApi.get('/meetings/' + meetingId + '/members')
    if (res.data?.success) {
      members.value = res.data.data?.members || []
      // Restore already checked-in from the store
      members.value.forEach(m => {
        if (m.checked_in) checkedInMembers.value.add(m.member_id)
      })
    }
  } catch {
    // Members unavailable
  }
}

async function checkinMember(member: MemberItem) {
  if (!member.invitation_id) return
  if (checkedInMembers.value.has(member.member_id)) return

  try {
    const res = await participantApi.post('/checkin/member', {
      invitation_id: member.invitation_id,
    })

    if (res.data?.success) {
      checkedInMembers.value.add(member.member_id)
      member.checked_in = true
      member.checked_in_at = res.data.data?.checked_in_at || new Date().toISOString()
      portalStore.markCheckIn(String(meetingInfo.value?.meeting_id || ''))
    }
  } catch {
    // Check-in failed
  }
}

function getInitials(name: string): string {
  return name.charAt(0).toUpperCase() || '?'
}

function getAvatarColor(name: string): string {
  const colors = ['#0D62D5', '#D4AF37', '#22C55E', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

async function handleManualSubmit() {
  await handleCode(codeInput.value)
}

function switchMode(m: 'scan' | 'manual') {
  mode.value = m
  scanResult.value = 'idle'
  resultMessage.value = ''
  codeInput.value = ''

  if (m === 'scan') {
    loadQrScanner()
  } else {
    stopScanner()
  }
}

function goBack() {
  stopScanner()
  if (step.value === 'members') {
    step.value = 'input'
    members.value = []
    meetingInfo.value = null
    return
  }
  router.push('/')
}

onMounted(() => {
  loadQrScanner()
})

onUnmounted(() => {
  stopScanner()
})
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
        <h1>{{ step === 'members' ? 'ចុះឈ្មោះចូលរួម' : 'ចុះឈ្មោះចូលរួម' }}</h1>
        <div class="spacer" />
      </div>

      <!-- Step 1: Code input (scan or manual) -->
      <template v-if="step === 'input'">
        <!-- Mode switcher -->
        <div class="mode-tabs">
          <button
            :class="['mode-tab', { active: mode === 'scan' }]"
            type="button"
            @click="switchMode('scan')"
          >
            <QrCode :size="18" /> ស្កេន QR
          </button>
          <button
            :class="['mode-tab', { active: mode === 'manual' }]"
            type="button"
            @click="switchMode('manual')"
          >
            <KeyRound :size="18" /> បញ្ចូលលេខកូដ
          </button>
        </div>

        <!-- QR Scanner -->
        <div v-show="mode === 'scan'" class="scanner-section">
          <div id="qr-reader" class="qr-reader" />
          <p class="hint">សូមដាក់លេខកូដ QR នៅពីមុខកាមេរ៉ា</p>
        </div>

        <!-- Manual input -->
        <div v-show="mode === 'manual'" class="manual-section">
          <form @submit.prevent="handleManualSubmit">
            <div class="field">
              <label for="code">បញ្ចូលលេខកូដចូលរួម</label>
              <input
                id="code"
                v-model="codeInput"
                type="text"
                placeholder="ឧ. MTG-A7K3 ឬ OCM-X9F2"
                maxlength="20"
                class="code-input"
                autocomplete="off"
                required
              />
            </div>
            <button class="submit-btn" type="submit" :disabled="submitting || !codeInput.trim()">
              <Loader2 v-if="submitting" :size="18" class="spinner" />
              <CheckCircle v-else :size="18" />
              {{ submitting ? 'កំពុងផ្ទៀងផ្ទាត់...' : 'ផ្ទៀងផ្ទាត់' }}
            </button>
          </form>
        </div>

        <!-- Result toast -->
        <div v-if="scanResult !== 'idle'" :class="['result-toast', scanResult]">
          <CheckCircle v-if="scanResult === 'success'" :size="20" />
          <XCircle v-else :size="20" />
          <span>{{ resultMessage }}</span>
        </div>
      </template>

      <!-- Step 2: Member thumbnails grid -->
      <template v-if="step === 'members'">
        <div class="meeting-badge">
          <div class="meeting-badge-info">
            <span class="meeting-badge-code">{{ meetingInfo?.meeting_code }}</span>
            <span class="meeting-badge-title">{{ meetingInfo?.meeting_objective }}</span>
          </div>
        </div>

        <div class="members-grid">
          <button
            v-for="member in members"
            :key="member.member_id"
            :class="['member-card', { checked: checkedInMembers.has(member.member_id) }]"
            type="button"
            :disabled="!member.invitation_id || checkedInMembers.has(member.member_id)"
            @click="checkinMember(member)"
          >
            <div class="member-avatar" :style="{ background: getAvatarColor(member.name) }">
              {{ member.avatar || getInitials(member.name) }}
            </div>
            <div class="member-info">
              <strong>{{ member.name }}</strong>
              <span>{{ member.role === 'leader' ? 'ប្រធាន' : member.role === 'deputy_leader' ? 'អនុប្រធាន' : 'សមាជិក' }}</span>
            </div>
            <div v-if="checkedInMembers.has(member.member_id)" class="member-checked">
              <CheckCircle :size="20" />
            </div>
          </button>

          <div v-if="members.length === 0" class="empty-members">
            <p>មិនទាន់មានអ្នកចូលរួម</p>
          </div>
        </div>

        <div class="members-footer">
          <span class="checked-count">{{ checkedInMembers.size }} / {{ members.length }} នាក់</span>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.flag-bar { position: fixed; top: 0; left: 0; right: 0; z-index: 200; display: flex; flex-direction: column; height: 6px; }
.flag-stripe.blue-top { height: 2px; background: #032ea1; }
.flag-stripe.red { height: 2px; background: #e00025; }
.flag-stripe.blue-bottom { height: 2px; background: #032ea1; }

.checkin-page {
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: 24px;
  background: linear-gradient(135deg, #f5f8fc 0%, #e8eef5 100%);
}

.checkin-card {
  width: 100%;
  max-width: 520px;
  background: #fff;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0,0,0,0.06);
}

.card-header-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px 0;
}

.card-header-bar h1 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text);
  text-align: center;
  flex: 1;
}

.spacer { width: 36px; }

.back-btn {
  display: inline-grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  background: #fff;
  color: var(--color-text);
  cursor: pointer;
  flex-shrink: 0;
}
.back-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }

/* Mode tabs */
.mode-tabs {
  display: flex;
  gap: 8px;
  padding: 16px 24px 0;
}

.mode-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-secondary);
  background: #f8fafc;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  cursor: pointer;
  transition: all var(--transition);
}

.mode-tab.active {
  color: #fff;
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.mode-tab:hover:not(.active) {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

/* QR Scanner */
.scanner-section {
  padding: 24px;
  text-align: center;
}

.qr-reader {
  width: 100%;
  max-width: 320px;
  margin: 0 auto;
  border-radius: 12px;
  overflow: hidden;
  border: 2px dashed var(--color-border);
}

.hint {
  margin: 16px 0 0;
  font-size: 13px;
  color: var(--color-text-secondary);
}

/* Manual input */
.manual-section {
  padding: 24px;
}

.field {
  display: grid;
  gap: 8px;
  margin-bottom: 16px;
}

.field label {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text);
}

.code-input {
  width: 100%;
  padding: 14px 16px;
  font-size: 20px;
  font-family: 'Courier New', monospace;
  font-weight: 700;
  letter-spacing: 4px;
  text-align: center;
  text-transform: uppercase;
  color: var(--color-text);
  background: #f8fafc;
  border: 2px solid var(--color-border);
  border-radius: 12px;
  outline: none;
  transition: border-color var(--transition), box-shadow var(--transition);
}

.code-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(13,98,213,0.1);
}

.code-input::placeholder {
  font-size: 14px;
  letter-spacing: 1px;
  font-family: var(--font-body);
  color: #94a3b8;
}

.submit-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px;
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  background: var(--color-primary);
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: background var(--transition);
}

.submit-btn:hover:not(:disabled) { background: var(--color-primary-hover); }
.submit-btn:disabled { opacity: 0.5; cursor: default; }

.spinner { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Result toast */
.result-toast {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  margin: 0 24px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
}

.result-toast.success {
  color: #15803d;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
}

.result-toast.error {
  color: #b91c1c;
  background: #fef2f2;
  border: 1px solid #fecaca;
}

/* Meeting badge */
.meeting-badge {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 16px 24px;
  padding: 12px 16px;
  background: #f0f6ff;
  border: 1px solid #dbe8ff;
  border-radius: 12px;
}

.meeting-badge-info {
  display: grid;
  gap: 2px;
}

.meeting-badge-code {
  font-size: 12px;
  font-weight: 700;
  color: var(--color-primary);
  letter-spacing: 1px;
}

.meeting-badge-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text);
}

/* Members grid */
.members-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
  padding: 0 24px 16px;
}

.member-card {
  position: relative;
  display: grid;
  gap: 8px;
  justify-items: center;
  padding: 16px 12px;
  border: 2px solid var(--color-border);
  border-radius: 14px;
  background: #fff;
  cursor: pointer;
  transition: all var(--transition);
  text-align: center;
}

.member-card:hover:not(:disabled) {
  border-color: var(--color-primary);
  box-shadow: 0 4px 12px rgba(13,98,213,0.1);
  transform: translateY(-2px);
}

.member-card.checked {
  border-color: var(--color-success);
  background: #f0fdf4;
  cursor: default;
}

.member-card:disabled {
  opacity: 0.7;
  cursor: default;
}

.member-avatar {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  color: #fff;
  font-size: 20px;
  font-weight: 700;
}

.member-info {
  display: grid;
  gap: 2px;
}

.member-info strong {
  font-size: 13px;
  line-height: 1.2;
  color: var(--color-text);
}

.member-info span {
  font-size: 11px;
  color: var(--color-text-secondary);
}

.member-checked {
  position: absolute;
  top: -6px;
  right: -6px;
  color: var(--color-success);
  background: #fff;
  border-radius: 50%;
  line-height: 0;
}

.empty-members {
  grid-column: 1 / -1;
  padding: 40px;
  text-align: center;
  color: var(--color-text-secondary);
}

.members-footer {
  display: flex;
  justify-content: center;
  padding: 0 24px 20px;
}

.checked-count {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text-secondary);
  background: #f8fafc;
  padding: 8px 20px;
  border-radius: 999px;
}
</style>
