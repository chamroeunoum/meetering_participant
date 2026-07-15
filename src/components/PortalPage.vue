<script setup lang="ts">
import { ArrowRight, BookOpen, Calendar, QrCode, ShieldCheck } from 'lucide-vue-next'
import type { LucideIcon } from 'lucide-vue-next'
import { portals } from '@/data/portals'
import { useRouter } from 'vue-router'
import { usePortalStore } from '@/stores/portal'

const router = useRouter()
const portalStore = usePortalStore()

const iconMap: Record<string, LucideIcon> = {
  qrCode: QrCode,
  calendar: Calendar,
  shieldCheck: ShieldCheck,
  bookOpen: BookOpen,
}

function openPortal(portalId: string) {
  portalStore.setActivePortal(portalId)
  router.push(`/${portalId}`)
}
</script>

<template>
  <main class="portal-page">
    <!-- Logo header -->
    <header class="portal-top-header">
      <img class="portal-main-logo" src="/assets/ocm-logo.svg" alt="ទីស្ដីការគណៈរដ្ឋមន្ត្រី" />
    </header>

    <!-- Title -->
    <div class="page-title-wrap">
      <div class="page-emblem">✦</div>
      <h1 class="page-title">ប្រព័ន្ធគ្រប់គ្រងកិច្ចប្រជុំ</h1>
      <p class="page-subtitle">ផ្ទាំងសេវាកម្មសម្រាប់អ្នកចូលរួម</p>
    </div>

    <!-- Service list -->
    <div class="service-list">
      <button
        v-for="portal in portals"
        :key="portal.id"
        class="service-item"
        type="button"
        @click="openPortal(portal.id)"
      >
        <span class="service-icon" aria-hidden="true">
          <component :is="iconMap[portal.icon]" :size="24" :stroke-width="2" />
        </span>
        <span class="service-info">
          <strong class="service-name">{{ portal.title }}</strong>
          <span class="service-desc">{{ portal.description }}</span>
        </span>
        <span class="service-arrow">
          <ArrowRight :size="18" :stroke-width="2.5" />
        </span>
      </button>
    </div>
  </main>
</template>

<style scoped>
/* ===== Layout ===== */
.portal-page {
  width: min(800px, 100%);
  min-height: 100vh;
  margin: 0 auto;
  padding: 8px 24px 48px;
}

/* ===== Top Header ===== */
.portal-top-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 0 20px;
}

.portal-main-logo {
  width: 130px;
  height: 130px;
  object-fit: contain;
}

/* ===== Page Title ===== */
.page-title-wrap {
  text-align: center;
  margin-bottom: 36px;
}

.page-emblem {
  font-size: 18px;
  color: var(--color-accent);
  margin-bottom: 6px;
  opacity: 0.6;
}

.page-title {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.3;
}

.page-title::after {
  content: "";
  display: block;
  width: 50px;
  height: 3px;
  margin: 14px auto 0;
  background: linear-gradient(90deg, var(--color-accent), rgba(212, 175, 55, 0.2));
  border-radius: 2px;
}

.page-subtitle {
  margin: 12px 0 0;
  font-size: 15px;
  color: var(--color-text-secondary);
  font-weight: 500;
}

/* ===== Service List ===== */
.service-list {
  display: grid;
  gap: 12px;
  padding-bottom: 48px;
}

.service-item {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 18px 20px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(232, 238, 245, 0.7);
  border-radius: 16px;
  cursor: pointer;
  text-align: left;
  color: var(--color-text);
  transition: all var(--transition);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.service-item:hover {
  background: rgba(255, 255, 255, 0.95);
  border-color: var(--color-primary);
  box-shadow: 0 4px 16px rgba(13, 98, 213, 0.1);
  transform: translateY(-2px);
}

.service-item:active {
  transform: translateY(0);
}

.service-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  color: var(--color-primary);
  background: rgba(13, 98, 213, 0.08);
  border-radius: 12px;
  transition: all var(--transition);
}

.service-item:hover .service-icon {
  color: #ffffff;
  background: var(--color-primary);
}

.service-info {
  flex: 1;
  min-width: 0;
  display: grid;
  gap: 2px;
}

.service-name {
  font-family: var(--font-heading);
  font-size: 17px;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.4;
}

.service-desc {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.service-arrow {
  flex-shrink: 0;
  color: var(--color-accent);
  transition: all var(--transition);
}

.service-item:hover .service-arrow {
  color: var(--color-primary);
  transform: translateX(3px);
}

/* ===== Responsive ===== */
@media (max-width: 640px) {
  .page-title { font-size: 24px; }
  .page-subtitle { font-size: 14px; }
  .portal-page {
    padding: 8px 16px 0;
  }

  .portal-top-header {
    padding: 24px 0 16px;
  }

  .portal-main-logo {
    width: 100px;
    height: 100px;
  }

  .page-title-wrap {
    margin-bottom: 28px;
  }

  .page-title {
    font-size: 22px;
  }

  .service-item {
    padding: 14px 16px;
    gap: 12px;
  }

  .service-icon {
    width: 40px;
    height: 40px;
  }

  .service-name {
    font-size: 15px;
  }

  .service-desc {
    font-size: 13px;
  }


}
</style>
