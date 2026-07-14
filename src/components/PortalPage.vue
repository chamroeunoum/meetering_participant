<script setup lang="ts">
import { Calendar, Settings } from 'lucide-vue-next'
import type { LucideIcon } from 'lucide-vue-next'
import PortalCard from '@/components/PortalCard.vue'
import { portalSections, portals } from '@/data/portals'
import { useRouter } from 'vue-router'
import { usePortalStore } from '@/stores/portal'

const router = useRouter()
const portalStore = usePortalStore()

const sectionIcons: Record<string, LucideIcon> = {
  calendar: Calendar,
  settings: Settings,
}

function openPortal(portalId: string) {
  portalStore.setActivePortal(portalId)
  router.push(`/${portalId}`)
}
</script>

<template>
  <main class="portal-page">
    <header class="portal-header">
      <div class="portal-hero-copy">
        <div class="portal-hero-label">
          <img class="portal-hero-logo" src="/assets/ocm-logo.svg" alt="" aria-hidden="true" />
          <div>
            <p class="page-eyebrow">ទីស្ដីការគណៈរដ្ឋមន្ត្រី</p>
            <p class="portal-hero-subtitle">Office of the Council of Ministers</p>
          </div>
        </div>
        <h1>ប្រព័ន្ធគ្រប់គ្រងកិច្ចប្រជុំ</h1>
        <div class="portal-hero-divider" aria-hidden="true">
          <span />
          <strong>✦</strong>
          <span />
        </div>
      </div>
      <div class="portal-hero-art">
        <img
          class="portal-hero-building"
          src="/assets/ocm-building-hero.png"
          alt=""
          aria-hidden="true"
        />
      </div>
    </header>

    <div class="portal-sections">
      <section
        v-for="section in portalSections"
        :key="section.id"
        class="portal-section"
        :aria-labelledby="`${section.id}-title`"
      >
        <div class="portal-section-header">
          <span class="portal-section-icon" aria-hidden="true">
            <component :is="sectionIcons[section.icon] || Calendar" :size="22" :stroke-width="2.2" />
          </span>
          <h2 :id="`${section.id}-title`">{{ section.title }}</h2>
        </div>
        <div class="portal-grid">
          <PortalCard
            v-for="portal in portals.filter((p) => p.section === section.id)"
            :key="portal.id"
            :portal="portal"
            @open="openPortal"
          />
        </div>
      </section>
    </div>
  </main>
</template>

<style scoped>
.portal-page {
  width: min(1440px, 100%);
  min-height: 100vh;
  margin: 0 auto;
  padding: 20px 32px;
}

.portal-header {
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 220px;
  gap: 32px;
  margin-bottom: 24px;
  padding: 28px 40px 32px 0;
  overflow: hidden;
  background: #ffffff;
  border: 1px solid var(--color-border-soft);
  border-radius: 22px;
  box-shadow: var(--shadow-md);
}

.portal-hero-copy {
  position: relative;
  z-index: 1;
  max-width: 760px;
  margin-left: 30px;
}

.portal-hero-label {
  display: inline-flex;
  align-items: center;
  gap: 18px;
  margin-bottom: 28px;
}

.portal-hero-logo {
  display: block;
  width: 72px;
  height: 72px;
  object-fit: contain;
}

.portal-hero-subtitle {
  margin: 8px 0 0;
  color: #D4AF37;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.35;
}

.portal-header h1 {
  max-width: 760px;
  margin: 0;
  color: #1B2142;
  font-family: var(--font-heading);
  font-size: 20px;
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1.2;
  text-shadow: 0 3px 10px rgba(0,0,0,.08);
}

.portal-hero-divider {
  display: flex;
  align-items: center;
  gap: 14px;
  width: min(420px, 100%);
  margin: 18px 0 0;
  color: #D4AF37;
}

.portal-hero-divider span {
  height: 1px;
  flex: 1;
  background: #D4AF37;
}

.portal-hero-divider strong {
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  font-size: 16px;
  line-height: 1;
}

.portal-hero-art {
  position: absolute;
  right: 28px;
  bottom: -15px;
  width: 460px;
  max-width: 38%;
  opacity: 0.16;
  pointer-events: none;
  z-index: 0;
}

.portal-hero-building {
  display: block;
  width: 100%;
  height: auto;
  filter: saturate(0.85) brightness(1.2);
  user-select: none;
}

.portal-sections {
  display: grid;
  gap: 20px;
}

.portal-section {
  display: grid;
  gap: 12px;
}

.portal-section-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.portal-section-icon {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  color: var(--color-primary);
  border: 1px solid rgba(13, 98, 213, 0.28);
  border-radius: 11px;
}

.portal-section-header h2 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 20px;
  font-weight: 400;
  color: var(--color-text);
}

.portal-section-header::after {
  content: "";
  flex: 1;
  height: 1px;
  background: var(--color-border);
}

.portal-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

@media (max-width: 900px) {
  .portal-header {
    min-height: 210px;
    padding: 26px 32px 30px 0;
  }

  .portal-hero-art {
    max-width: 48%;
    opacity: 0.14;
  }

  .portal-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .portal-header h1 {
    font-size: 20px;
  }
}

@media (max-width: 640px) {
  .portal-page {
    padding: 24px 16px 40px;
  }

  .portal-header {
    min-height: 190px;
    padding: 24px 20px 28px 0;
  }

  .portal-hero-label {
    gap: 14px;
    margin-bottom: 22px;
  }

  .portal-hero-logo {
    width: 60px;
    height: 60px;
  }

  .portal-hero-subtitle {
    font-size: 16px;
  }

  .portal-header h1 {
    font-size: 20px;
  }

  .portal-hero-copy {
    margin-left: 16px;
  }

  .portal-hero-art {
    display: none;
  }

  .portal-grid {
    grid-template-columns: 1fr;
  }
}
</style>
