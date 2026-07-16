<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { LogIn } from 'lucide-vue-next'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')

async function handleLogin() {
  if (!email.value || !password.value) {
    auth.error = 'សូមបញ្ចូលអ៊ីមែល និងពាក្យសម្ងាត់'
    return
  }
  const ok = await auth.login(email.value, password.value)
  if (ok) {
    router.push('/officer/invitations')
  }
}
</script>

<template>
  <div class="flag-bar">
    <div class="flag-stripe blue-top" /><div class="flag-stripe red" /><div class="flag-stripe blue-bottom" />
  </div>

  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <div class="login-logo-wrap">
          <span class="login-logo-text">OCM</span>
        </div>
        <h1>ចូលប្រើប្រាស់ប្រព័ន្ធ</h1>
        <p>ទីស្ដីការគណៈរដ្ឋមន្ត្រី</p>
      </div>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="field">
          <label for="email">អ៊ីមែល</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="admin@ocm.gov.kh"
            autocomplete="email"
            required
          />
        </div>

        <div class="field">
          <label for="password">ពាក្យសម្ងាត់</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="••••••••"
            autocomplete="current-password"
            required
          />
        </div>

        <div v-if="auth.error" class="login-error">{{ auth.error }}</div>

        <button class="login-btn" type="submit" :disabled="auth.loading">
          <LogIn :size="18" :stroke-width="2.5" />
          {{ auth.loading ? 'កំពុងចូល...' : 'ចូលប្រើប្រាស់' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.flag-bar { position: fixed; top: 0; left: 0; right: 0; z-index: 200; display: flex; flex-direction: column; height: 6px; }
.flag-stripe.blue-top { height: 2px; background: #032ea1; }
.flag-stripe.red { height: 2px; background: #e00025; }
.flag-stripe.blue-bottom { height: 2px; background: #032ea1; }

.login-page {
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: 24px;
  background: linear-gradient(135deg, #f5f8fc 0%, #e8eef5 100%);
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: #fff;
  border-radius: 20px;
  padding: 40px 32px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.06);
}

.login-header { text-align: center; margin-bottom: 32px; }
.login-logo-wrap { display: grid; place-items: center; width: 60px; height: 60px; margin: 0 auto 16px; border-radius: 50%; background: var(--color-primary); }
.login-logo-text { font-family: var(--font-heading); font-size: 22px; font-weight: 700; color: #fff; }
.login-header h1 { margin: 0; font-family: var(--font-heading); font-size: 22px; color: var(--color-text); }
.login-header p { margin: 4px 0 0; font-size: 13px; color: var(--color-accent); font-weight: 600; }

.login-form { display: grid; gap: 20px; }
.field { display: grid; gap: 6px; }
.field label { font-size: 13px; font-weight: 700; color: var(--color-text); }
.field input {
  width: 100%;
  padding: 12px 14px;
  font-size: 15px;
  color: var(--color-text);
  background: #f8fafc;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  outline: none;
  transition: border-color var(--transition), box-shadow var(--transition);
}
.field input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(13,98,213,0.1);
}
.field input::placeholder { color: #94a3b8; }

.login-error { padding: 10px 14px; font-size: 13px; color: #b91c1c; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; }

.login-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 13px;
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  background: var(--color-primary);
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: background var(--transition);
}
.login-btn:hover { background: var(--color-primary-hover); }
.login-btn:disabled { opacity: 0.6; cursor: default; }
</style>
