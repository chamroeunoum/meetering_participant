<script setup lang="ts">
import { computed } from 'vue'
import { Clock, Users } from 'lucide-vue-next'
import { useMeetingWorkspaceStore } from '@/stores/meetingWorkspace'
import { formatDuration, type AgendaItem, type Meeting } from '@/utils/data'

const props = defineProps<{ meeting: Meeting }>()

const workspace = useMeetingWorkspaceStore()
const ws = computed(() => workspace.getWorkspace(props.meeting.id))
// participants must reflect the live (editable) workspace copy, not the static JSON seed
const livePart = computed(() => ws.value.participants.map((p) => workspace.resolveParticipant(props.meeting.id, p)))

const totalDuration = computed(() => ws.value.agendas.reduce((s, i) => s + (Number(i.duration) || 0), 0))

function handlerNames(item: AgendaItem): string {
  if (!item.handlerIds.length) return ''
  return item.handlerIds
    .map((id) => livePart.value.find((p) => p.id === id)?.fullName)
    .filter(Boolean)
    .join(', ')
}
</script>

<template>
  <div class="agenda-tab">
    <div v-if="meeting.objective" class="agenda-objective card">
      <h3>គោលបំណងកិច្ចប្រជុំ</h3>
      <p>{{ meeting.objective }}</p>
    </div>

    <div class="agenda-toolbar">
      <h3>តារាងរបៀបវារៈ</h3>
    </div>

    <div v-if="ws.agendas.length === 0" class="empty-state">មិនទាន់មានធាតុរបៀបវារៈ</div>

    <ol v-else class="agenda-timeline">
      <li v-for="(item, index) in ws.agendas" :key="item.id" class="agenda-item">
        <div class="agenda-time-col">
          <span class="agenda-time">{{ item.start_time || '--:--' }}</span>
          <span class="agenda-node" />
          <span v-if="index < ws.agendas.length - 1" class="agenda-line" />
        </div>
        <div class="agenda-card">
          <div class="agenda-card-top">
            <div class="agenda-card-title">
              <span class="agenda-index">{{ index + 1 }}</span>
              <span>{{ item.topic }}</span>
            </div>
          </div>
          <div class="agenda-card-meta">
            <span class="meta-pill"><Clock :size="13" :stroke-width="2.3" />{{ item.duration }} នាទី</span>
            <span v-if="handlerNames(item)" class="meta-pill"><Users :size="13" :stroke-width="2.3" />{{ handlerNames(item) }}</span>
          </div>
        </div>
      </li>
    </ol>

    <div v-if="ws.agendas.length > 0" class="agenda-total">
      <span>រយៈពេលសរុប៖</span>
      <strong>{{ totalDuration }} នាទី</strong>
      <span class="agenda-total-sub">({{ formatDuration(totalDuration) }})</span>
    </div>
  </div>
</template>

<style scoped>
.agenda-tab {
  display: grid;
  gap: 20px;
}

.agenda-objective {
  padding: 16px 18px;
}

.agenda-objective h3 {
  margin: 0 0 6px;
  font-family: var(--font-heading);
  font-size: 16px;
  font-weight: 400;
}

.agenda-objective p {
  margin: 0;
  color: var(--color-text-secondary);
  line-height: 1.7;
}

.agenda-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.agenda-toolbar h3 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 18px;
  font-weight: 400;
}

.agenda-timeline {
  display: grid;
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

.agenda-item {
  display: flex;
  gap: 12px;
}

.agenda-time-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 64px;
  flex: none;
}

.agenda-time {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-primary);
}

.agenda-node {
  width: 10px;
  height: 10px;
  margin: 6px 0;
  background: var(--color-primary);
  border: 2px solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 0 1px var(--color-border);
}

.agenda-line {
  flex: 1;
  width: 2px;
  background: var(--color-border-soft);
}

.agenda-card {
  flex: 1;
  min-width: 0;
  margin-bottom: 16px;
  padding: 12px 14px;
  background: #fff;
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  transition: border-color var(--transition), box-shadow var(--transition);
}

.agenda-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-sm);
}

.agenda-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.agenda-card-title {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-weight: 700;
}

.agenda-index {
  color: var(--color-text-secondary);
  font-size: 12px;
  font-weight: 700;
}

.agenda-card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.meta-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  font-size: 12px;
  color: var(--color-text-secondary);
  background: var(--color-bg);
  border-radius: 999px;
}

.agenda-total {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  padding-top: 12px;
  border-top: 1px solid var(--color-border-soft);
}

.agenda-total strong {
  color: var(--color-primary);
}

.agenda-total-sub {
  color: var(--color-text-secondary);
  font-size: 13px;
}
</style>
