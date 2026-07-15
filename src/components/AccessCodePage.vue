<script setup lang="ts">
import { ref } from 'vue'
import { usePortalStore } from '@/stores/portal'
import { isValidPortalCode, sendOtp, isValidOtp } from '@/data/access'

const portalStore = usePortalStore()

// --- Tab state ---
const activeTab = ref<'code' | 'contact'>('code')

// --- Meeting code tab ---
const code = ref('')
const codeError = ref('')

function submitCode(event: Event) {
  event.preventDefault()
  if (isValidPortalCode(code.value)) {
    codeError.value = ''
    portalStore.grantAccess(code.value.trim().toUpperCase())
  } else {
    codeError.value = 'លេខកូដមិនត្រឹមត្រូវ។ សូមព្យាយាមម្តងទៀត។'
  }
}

// --- Phone/Email tab ---
const contact = ref('')
const contactError = ref('')
const otpSent = ref(false)
const otpCode = ref('')
const expectedOtp = ref('')
const otpError = ref('')
const sendingOtp = ref(false)

function submitContact(event: Event) {
  event.preventDefault()
  const val = contact.value.trim()
  if (!val) {
    contactError.value = 'សូមបញ្ចូលលេខទូរស័ព្ទ ឬអ៊ីមែល'
    return
  }
  contactError.value = ''
  sendingOtp.value = true
  setTimeout(() => {
    expectedOtp.value = sendOtp(val)
    otpSent.value = true
    sendingOtp.value = false
  }, 800)
}

function submitOtp(event: Event) {
  event.preventDefault()
  if (isValidOtp(otpCode.value, expectedOtp.value)) {
    otpError.value = ''
    portalStore.grantAccessByContact(contact.value.trim())
  } else {
    otpError.value = 'លេខកូដផ្ទៀងផ្ទាត់មិនត្រឹមត្រូវ។ សូមព្យាយាមម្តងទៀត។'
  }
}

function resendOtp() {
  expectedOtp.value = sendOtp(contact.value.trim())
  otpCode.value = ''
  otpError.value = ''
}

function backToContact() {
  otpSent.value = false
  otpCode.value = ''
  otpError.value = ''
}
</script>

<template>
  <main class="access-page">
    <!-- Logo header -->
    <header class="access-top-header">
      <img class="access-main-logo" src="/assets/ocm-logo.svg" alt="ទីស្ដីការគណៈរដ្ឋមន្ត្រី" />
    </header>

    <!-- Hero banner -->
    <section class="access-hero">
      <div class="access-hero-bg" />
      <div class="access-hero-content">
        <div class="access-hero-emblem">✦</div>
        <h2 class="access-hero-title">ប្រព័ន្ធគ្រប់គ្រងកិច្ចប្រជុំ</h2>
        <p class="access-hero-desc">ផ្ទាំងសេវាកម្មសម្រាប់អ្នកចូលរួម</p>
      </div>
    </section>

    <!-- Access card -->
    <section class="access-card-wrap">
      <div class="access-card card">
        <!-- Tabs -->
        <div class="access-tabs" role="tablist">
          <button
            :class="['tab-btn', { active: activeTab === 'code' }]"
            role="tab"
            :aria-selected="activeTab === 'code'"
            type="button"
            @click="activeTab = 'code'"
          >
            លេខកូដប្រជុំ
          </button>
          <button
            :class="['tab-btn', { active: activeTab === 'contact' }]"
            role="tab"
            :aria-selected="activeTab === 'contact'"
            type="button"
            @click="activeTab = 'contact'"
          >
            ទូរស័ព្ទ / អ៊ីមែល
          </button>
        </div>

        <div class="access-card-body">
          <!-- Tab 1: Meeting Code -->
          <template v-if="activeTab === 'code'">
            <p class="access-copy">
              សូមបញ្ចូលលេខកូដប្រជុំ ដើម្បីបើកផ្ទាំងសេវាកម្ម។
            </p>
            <form @submit="submitCode" class="access-form">
              <div class="form-group">
                <label class="form-label" for="meeting-code">លេខកូដប្រជុំ</label>
                <input
                  id="meeting-code"
                  class="form-input access-input"
                  v-model="code"
                  placeholder="បញ្ចូលលេខកូដ"
                  autocomplete="off"
                  autofocus
                />
              </div>
              <div v-if="codeError" class="access-error">{{ codeError }}</div>
              <button class="btn btn-primary access-button" type="submit">បញ្ជាក់</button>
            </form>
          </template>

          <!-- Tab 2: Phone / Email -->
          <template v-if="activeTab === 'contact'">
            <template v-if="!otpSent">
              <p class="access-copy">
                សូមបញ្ចូលលេខទូរស័ព្ទ ឬអ៊ីមែលរបស់អ្នក ដើម្បីទទួលលេខកូដផ្ទៀងផ្ទាត់។
              </p>
              <form @submit="submitContact" class="access-form">
                <div class="form-group">
                  <label class="form-label" for="contact-input">ទូរស័ព្ទ ឬ អ៊ីមែល</label>
                  <input
                    id="contact-input"
                    class="form-input"
                    v-model="contact"
                    placeholder="លេខទូរស័ព្ទ ឬ អ៊ីមែល"
                    autocomplete="off"
                    type="text"
                  />
                </div>
                <div v-if="contactError" class="access-error">{{ contactError }}</div>
                <button class="btn btn-primary access-button" type="submit" :disabled="sendingOtp">
                  {{ sendingOtp ? 'កំពុងផ្ញើ...' : 'ផ្ញើលេខកូដ' }}
                </button>
              </form>
            </template>

            <template v-else>
              <p class="access-copy">
                សូមបញ្ចូលលេខកូដ ៦ ខ្ទង់ ដែលយើងបានផ្ញើទៅ <strong>{{ contact }}</strong>
              </p>
              <form @submit="submitOtp" class="access-form">
                <div class="form-group">
                  <label class="form-label" for="otp-input">លេខកូដ ៦ ខ្ទង់</label>
                  <input
                    id="otp-input"
                    class="form-input otp-input"
                    v-model="otpCode"
                    placeholder="០ ០ ០ ០ ០ ០"
                    autocomplete="off"
                    maxlength="6"
                    inputmode="numeric"
                    autofocus
                  />
                </div>
                <div v-if="otpError" class="access-error">{{ otpError }}</div>
                <button class="btn btn-primary access-button" type="submit">ផ្ទៀងផ្ទាត់</button>
                <div class="otp-actions">
                  <button class="btn btn-ghost" type="button" @click="resendOtp">ផ្ញើម្តងទៀត</button>
                  <button class="btn btn-ghost" type="button" @click="backToContact">ផ្លាស់ប្តូរ</button>
                </div>
              </form>
            </template>
          </template>
        </div>
      </div>
    </section>

  </main>
</template>

<style scoped>
/* ===== Page Layout ===== */
.access-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 24px 48px;
}

/* ===== Top Header ===== */
.access-top-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 32px 0 20px;
  width: 100%;
  max-width: 600px;
}

.access-main-logo {
  width: 130px;
  height: 130px;
  object-fit: contain;
}

/* ===== Hero Banner ===== */
.access-hero {
  position: relative;
  width: 100%;
  max-width: 600px;
  min-height: 140px;
  display: flex;
  align-items: center;
  padding: 28px 32px;
  overflow: hidden;
  background: linear-gradient(135deg, #0d62d5 0%, #034577 60%, #022b4f 100%);
  border-radius: 20px;
  margin-bottom: 24px;
  box-shadow: var(--shadow-md);
}

.access-hero-bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse 80% 60% at 0% 50%, rgba(212, 175, 55, 0.08) 0%, transparent 100%);
  pointer-events: none;
}

.access-hero-content {
  position: relative;
  z-index: 1;
}


.access-hero-emblem {
  font-size: 18px;
  color: var(--color-accent);
  margin-bottom: 6px;
  opacity: 0.7;
}

.access-hero-title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 26px;
  font-weight: 700;
  color: #ffffff;
  line-height: 1.3;
  text-shadow: 0 2px 16px rgba(0, 0, 0, 0.12);
}

.access-hero-title::after {
  content: "";
  display: block;
  width: 50px;
  height: 3px;
  margin-top: 12px;
  background: linear-gradient(90deg, var(--color-accent), rgba(212, 175, 55, 0.2));
  border-radius: 2px;
}

.access-hero-desc {
  margin: 12px 0 0;
  font-size: 15px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 500;
}

/* ===== Access Card ===== */
.access-card-wrap {
  width: 100%;
  max-width: 600px;
  margin-bottom: 40px;
}

.access-card {
  overflow: hidden;
}

.access-card-body {
  padding: 24px 28px 28px;
}

.access-tabs {
  display: flex;
  border-bottom: 1px solid var(--color-border);
}

.tab-btn {
  flex: 1;
  padding: 14px 12px;
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text-secondary);
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  transition: color var(--transition), border-color var(--transition);
}

.tab-btn.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
}

.tab-btn:hover:not(.active) {
  color: var(--color-text);
}

.access-copy {
  color: var(--color-text-secondary);
  margin: 0 0 20px;
  font-size: 15px;
  line-height: 1.6;
}

.access-copy strong {
  color: var(--color-text);
  font-weight: 700;
}

.access-form {
  display: grid;
  gap: 12px;
}

.access-input {
  text-transform: uppercase;
}

.otp-input {
  text-align: center;
  font-size: 28px;
  letter-spacing: 12px;
  font-weight: 700;
}

.access-error {
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: var(--color-danger-light);
  color: var(--color-danger);
  font-weight: 700;
}

.access-button {
  width: 100%;
}

.otp-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 4px;
}

.btn-ghost {
  background: transparent;
  border: none;
  color: var(--color-primary);
  font-weight: 600;
  padding: 6px 12px;
  font-size: 14px;
}

.btn-ghost:hover {
  text-decoration: underline;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ===== Footer ===== */

.access-footer p {
  margin: 0;
}


/* ===== Responsive ===== */
@media (max-width: 640px) {
  .page-title { font-size: 24px; }
  .page-subtitle { font-size: 14px; }
  .access-page {
    padding: 8px 16px 0;
  }

  .access-top-header {
    gap: 14px;
    padding: 24px 0 16px;
  }

  .access-main-logo {
    width: 90px;
    height: 90px;
  }

  .access-hero {
    min-height: 120px;
    padding: 24px;
  }

  .access-hero-title {
    font-size: 20px;
  }

  .access-card-body {
    padding: 20px;
  }
}
</style>
