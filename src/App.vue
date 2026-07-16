<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePortalStore } from '@/stores/portal'
import ocmLogo from '@/assets/logo.svg'
import { LogOut } from 'lucide-vue-next'

const router = useRouter()
const portalStore = usePortalStore()
const displayName = computed(() => {
  const info = portalStore.personInfo
  if (info?.firstname) {
    return (info.firstname + ' ' + (info.lastname || '')).trim()
  }
  return portalStore.visitor?.name || ''
})
const displayTitle = computed(() => {
  const info = portalStore.personInfo
  if (info?.email) return info.email
  if (info?.phone) return info.phone
  return portalStore.visitor?.title || ''
})
const displayAvatar = computed(() => {
  const info = portalStore.personInfo
  if (info?.firstname) return info.firstname.charAt(0).toUpperCase()
  return portalStore.visitor?.avatar || 'ភ'
})

function handleLogout() {
  portalStore.reset()
  router.push('/')
}

const now = ref(new Date())
let timer: ReturnType<typeof setInterval> | null = null
onMounted(() => { timer = setInterval(() => { now.value = new Date() }, 1000) })
onUnmounted(() => { if (timer) clearInterval(timer) })

function pad(n: number) { return String(n).padStart(2, '0') }
const timeStr = computed(() => {
  const d = now.value
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
})
const dateStr = computed(() => {
  const d = now.value
  const months = ['មករា','កុម្ភៈ','មីនា','មេសា','ឧសភា','មិថុនា','កក្កដា','សីហា','កញ្ញា','តុលា','វិច្ឆិកា','ធ្នូ']
  return `${pad(d.getDate())} ${months[d.getMonth()]} ${d.getFullYear()}`
})
</script>

<template>
  <!-- Flag bar -->
  <div class="flag-bar">
    <div class="flag-stripe blue-top" />
    <div class="flag-stripe red" />
    <div class="flag-stripe blue-bottom" />
  </div>

  <!-- OCM Top Bar (hidden during verification) -->
  <header v-if="portalStore.hasAccess" class="app-topbar">
    <div class="topbar-left">
      <img class="topbar-logo" :src="ocmLogo" alt="ទីស្ដីការគណៈរដ្ឋមន្ត្រី" />
      <div class="topbar-text">
        <strong>ទីស្ដីការគណៈរដ្ឋមន្ត្រី</strong>
        <span>Office of the Council of Ministers</span>
      </div>
    </div>

    <div class="topbar-right">
      <div class="topbar-clock">
        <span class="clock-time">{{ timeStr }}</span>
        <span class="clock-date">{{ dateStr }}</span>
      </div>
      <span class="topbar-divider" />
      <div v-if="displayName" class="visitor-wrap">
        <div class="visitor-info">
          <strong>{{ displayName }}</strong>
          <span>{{ displayTitle }}</span>
        </div>
        <span class="visitor-avatar">{{ displayAvatar }}</span>
      </div>
      <button class="logout-btn" type="button" title="ចាកចេញ" @click="handleLogout">
        <LogOut :size="16" :stroke-width="2.5" />
      </button>
    </div>
  </header>

  <div class="app-shell">
    <router-view />
    <footer class="app-footer">
      <p>&copy; {{ new Date().getFullYear() }} ទីស្ដីការគណៈរដ្ឋមន្ត្រី។ រក្សាសិទ្ធិគ្រប់យ៉ាង។</p>
    </footer>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Battambang:wght@400;700&family=Inter:wght@400;500;600;700;800;900&family=Noto+Sans+Khmer:wght@400;500;600;700&family=Noto+Serif+Khmer:wght@400;700&family=Suwannaphum:wght@300;400;700&family=Moul:wght@400&display=swap');

:root {
  --font-heading: "Suwannaphum", "Noto Serif Khmer", "Battambang", "Moul", serif;
  --font-body: "Inter", "Noto Sans Khmer", "Battambang", "Suwannaphum", "Segoe UI", system-ui, sans-serif;
  --color-primary: #0D62D5;
  --color-primary-hover: #005ba1;
  --color-accent: #D4AF37;
  --color-accent-pale: #F6E7A1;
  --color-danger: #EF4444;
  --color-danger-light: #fdecea;
  --color-success: #22C55E;
  --color-warning: #F59E0B;
  --color-text: #1B2142;
  --color-text-secondary: #64748B;
  --color-border: #E5E7EB;
  --color-border-soft: #E8EEF5;
  --color-bg: #F5F8FC;
  --color-bg-card: #FFFFFF;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 8px 30px rgba(15,23,42,0.06);
  --shadow-lg: 0 18px 46px rgba(15,23,42,0.13);
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 20px;
  --transition: 300ms ease;
}

*, *::before, *::after { box-sizing: border-box; }
html, body { height: 100%; margin: 0; }

body {
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.7;
  color: var(--color-text);
  background: linear-gradient(180deg, rgba(245, 248, 252, 0.92) 0%, rgba(245, 248, 252, 0.88) 100%), url('/assets/ocm-building-hero.png') center 30% / cover fixed;
  -webkit-font-smoothing: antialiased;
}
#app { min-height: 100%; }

.app-shell { display: flex; flex-direction: column; min-height: 100vh; padding-bottom: 33px; }
a { color: inherit; text-decoration: none; }
button, input { font: inherit; }
button { cursor: pointer; }

/* ===== Flag ===== */
.flag-bar { position: fixed; top: 0; left: 0; right: 0; z-index: 200; display: flex; flex-direction: column; height: 6px; }
.flag-stripe.blue-top { height: 2px; background: #032ea1; }
.flag-stripe.red { height: 2px; background: #e00025; }
.flag-stripe.blue-bottom { height: 2px; background: #032ea1; }

/* ===== Top Bar ===== */
.app-topbar { position: fixed; top: 6px; left: 0; right: 0; z-index: 199; display: flex; align-items: center; justify-content: space-between; padding: 6px 20px; height: 66px; background: rgba(255,255,255,0.95); backdrop-filter: blur(8px); border-bottom: 1px solid var(--color-border-soft); }
.topbar-left { display: flex; align-items: center; gap: 12px; }
.topbar-logo { width: 44px; height: 44px; object-fit: contain; }
.topbar-text { text-align: left; }
.topbar-text strong { display: block; font-family: var(--font-heading); font-size: 16px; font-weight: 700; color: var(--color-text); line-height: 1.2; }
.topbar-text span { display: block; font-size: 10px; color: var(--color-accent); font-weight: 600; letter-spacing: 0.3px; margin-top: 1px; }

.topbar-right { display: flex; align-items: center; gap: 14px; }
.topbar-divider { display: block; width: 1px; height: 30px; background: #d1d5db; flex-shrink: 0; }
.topbar-clock { text-align: right; line-height: 1.2; }
.clock-time { display: block; font-size: 15px; font-weight: 700; color: var(--color-text); font-variant-numeric: tabular-nums; }
.clock-date { display: block; font-size: 10px; color: var(--color-text-secondary); margin-top: 1px; }

.visitor-wrap { display: flex; align-items: center; gap: 10px; }
.visitor-info { text-align: right; }
.visitor-info strong { display: block; font-size: 13px; font-weight: 700; color: var(--color-text); line-height: 1.2; }
.visitor-info span { display: block; font-size: 11px; color: var(--color-text-secondary); margin-top: 1px; }
.visitor-avatar { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; background: var(--color-primary); color: #fff; font-size: 14px; font-weight: 700; flex-shrink: 0; }
.logout-btn { display: inline-grid; place-items: center; width: 36px; height: 36px; border: 1px solid var(--color-border); border-radius: 10px; background: #fff; color: var(--color-text-secondary); cursor: pointer; transition: all var(--transition); flex-shrink: 0; }
.logout-btn:hover { color: var(--color-danger); border-color: var(--color-danger); background: var(--color-danger-light); }

/* ===== Utilities ===== */
.card { background: var(--color-bg-card); border: 1px solid var(--color-border-soft); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); }
.card-body { padding: 20px; }
.card-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 16px 20px; border-bottom: 1px solid var(--color-border-soft); }
.form-group { display: grid; gap: 8px; }
.form-label { font-weight: 700; }
.form-input { width: 100%; min-height: 46px; padding: 10px 12px; color: var(--color-text); background: #fff; border: 1px solid var(--color-border); border-radius: var(--radius-sm); }
.form-input:focus { border-color: var(--color-primary); outline: 3px solid rgba(217, 154, 0, 0.16); }

.btn { display: inline-flex; align-items: center; justify-content: center; min-height: 40px; padding: 8px 16px; border: 1px solid transparent; border-radius: var(--radius-sm); font-weight: 700; transition: all var(--transition); }
.btn-primary { color: #fff; background: var(--color-primary); }
.btn-primary:hover { background: var(--color-primary-hover); }
.btn-secondary { color: var(--color-primary); background: #fff; border-color: var(--color-primary); }
.btn-secondary:hover { background: rgba(217, 154, 0, 0.06); border-color: var(--color-primary-hover); color: var(--color-primary-hover); }

.embedded-portal { flex: 1; }

/* ===== Footer ===== */
.app-footer { position: fixed; bottom: 0; left: 0; right: 0; z-index: 50; text-align: center; padding: 7px 16px; font-size: 11px; color: rgba(255,255,255,0.5); background: linear-gradient(180deg, #0d1b3e 0%, #07122a 100%); }
.app-footer p { margin: 0; }

@media (max-width: 640px) {
  .app-shell h1, .app-shell h2 { word-break: break-word; }
  .app-topbar { padding: 5px 12px; height: 58px; }
  .topbar-logo { width: 36px; height: 36px; }
  .topbar-text strong { font-size: 14px; }
  .topbar-text span { display: none; }
  .clock-date { display: none; }
  .visitor-info { display: none; }
}
</style>
