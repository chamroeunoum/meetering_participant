<script setup lang="ts">
import { computed } from 'vue'
import { ArrowRight, BookOpen, Calendar, PenSquare, QrCode, ShieldCheck, UserCog, type LucideIcon } from 'lucide-vue-next'
import type { Portal } from '@/data/portals'

const props = defineProps<{
  portal: Portal
}>()

const emit = defineEmits<{
  open: [portalId: string]
}>()

const iconMap: Record<string, LucideIcon> = {
  qrCode: QrCode,
  calendar: Calendar,
  shieldCheck: ShieldCheck,
  penSquare: PenSquare,
  userCog: UserCog,
  bookOpen: BookOpen,
}

const Icon = computed(() => iconMap[props.portal.icon] || QrCode)

function handleClick() {
  emit('open', props.portal.id)
}
</script>

<template>
  <button class="portal-card card" type="button" @click="handleClick">
    <span class="portal-card-heading">
      <span class="portal-icon" aria-hidden="true">
        <component :is="Icon" :size="28" :stroke-width="2.2" />
      </span>
      <strong>{{ portal.title }}</strong>
    </span>
    <span class="portal-content">
      <span>{{ portal.description }}</span>
    </span>
    <span class="portal-action">
      បើក <ArrowRight :size="19" :stroke-width="2.3" />
    </span>
  </button>
</template>

<style scoped>
.portal-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 180px;
  padding: 16px 18px;
  overflow: hidden;
  color: inherit;
  text-align: left;
  border-color: var(--color-border-soft);
  border-radius: 18px;
  background: #ffffff;
  cursor: pointer;
  transition: transform var(--transition), box-shadow var(--transition), border-color var(--transition);
}

.portal-card:hover {
  transform: translateY(-4px);
  border-color: var(--color-primary);
  box-shadow: var(--shadow-lg);
}

.portal-icon {
  display: grid;
  flex: 0 0 auto;
  place-items: center;
  width: 52px;
  height: 52px;
  color: var(--color-accent);
  background: var(--color-accent-pale);
  border: 1px solid rgba(217, 154, 0, 0.18);
  border-radius: 16px;
  transition: background var(--transition), color var(--transition), border-color var(--transition);
}

.portal-card-heading {
  display: flex;
  align-items: center;
  gap: 14px;
}

.portal-card-heading strong {
  color: var(--color-text);
  font-family: var(--font-heading);
  font-size: 20px;
  font-weight: 400;
  line-height: 1.45;
}

.portal-card:hover .portal-icon {
  color: #ffffff;
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.portal-content {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.portal-content span {
  font-family: var(--font-body);
  color: var(--color-text-secondary);
  font-size: 16px;
  line-height: 1.7;
}

.portal-action {
  margin-top: auto;
  align-self: flex-end;
  color: var(--color-accent);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 16px;
  font-weight: 600;
  transition: color var(--transition);
}

.portal-card:hover .portal-action {
  color: var(--color-primary);
}
</style>
