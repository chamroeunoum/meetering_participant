<script setup lang="ts">
import { useRouter } from 'vue-router'
import { usePortalStore } from '@/stores/portal'
import { ArrowLeft, ShieldCheck } from 'lucide-vue-next'

const router = useRouter()
const portalStore = usePortalStore()

function goBack() {
  portalStore.clearActivePortal()
  router.push('/portal')
}
</script>

<template>
  <div class="service-page">
    <!-- Header -->
    <header class="service-header">
      <button class="back-btn" type="button" @click="goBack">
        <ArrowLeft :size="20" :stroke-width="2.5" />
        ត្រឡប់ទៅផ្ទាំងសេវាកម្ម
      </button>
      <div class="header-center">
        <div class="header-icon">
          <ShieldCheck :size="22" :stroke-width="2" />
        </div>
        <h1 class="header-title">ផ្ទៀងផ្ទាត់អ្នកចូលរួម</h1>
      </div>
    </header>

    <!-- Content -->
    <main class="service-content">
      <div class="content-card">
        <div class="card-icon-wrap">
          <ShieldCheck :size="32" :stroke-width="1.5" />
        </div>
        <h2 class="card-heading">ផ្ទៀងផ្ទាត់ការចូលរួម</h2>
        <p class="card-text">ផ្ទៀងផ្ទាត់ការចូលរួម និងព័ត៌មានអ្នកចូលរួម</p>
      </div>
    </main>
  </div>
</template>

<style scoped>

.service-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 8px 24px 48px;
}

.service-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px 0 20px;
  border-bottom: 1px solid var(--color-border-soft);
  margin-bottom: 24px;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-primary);
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  cursor: pointer;
  transition: all var(--transition);
}
.back-btn:hover {
  background: #fff;
  border-color: var(--color-primary);
}

.header-center {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  color: var(--color-primary);
  background: rgba(13, 98, 213, 0.08);
  border-radius: 10px;
}

.header-title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text);
}

.service-content {
  display: grid;
  place-items: center;
  min-height: 50vh;
}

.content-card {
  text-align: center;
  padding: 40px 32px;
  max-width: 420px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  border: 1px solid var(--color-border-soft);
  border-radius: 20px;
  box-shadow: var(--shadow-sm);
}

.card-icon-wrap {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  color: var(--color-primary);
  background: rgba(13, 98, 213, 0.08);
  border-radius: 16px;
}

.card-heading {
  margin: 0 0 8px;
  font-family: var(--font-heading);
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text);
}

.card-text {
  margin: 0;
  font-size: 15px;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

@media (max-width: 640px) {
  .service-page { padding: 8px 16px 48px; }
  .service-header { flex-direction: column; align-items: flex-start; }
  .header-title { font-size: 18px; }
}
</style>
