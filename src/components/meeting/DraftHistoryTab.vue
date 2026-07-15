<script setup lang="ts">
import { computed } from 'vue'
import { CheckCircle2, Clock3, History, UserRound } from 'lucide-vue-next'
import { useMeetingWorkspaceStore } from '@/stores/meetingWorkspace'
import type { Meeting } from '@/utils/data'

const props = defineProps<{ meeting: Meeting }>()

const workspace = useMeetingWorkspaceStore()
const ws = computed(() => workspace.getWorkspace(props.meeting.id))
</script>

<template>
  <div class="history-tab">
    <div class="history-head">
      <div class="history-head-icon"><History :size="18" :stroke-width="2.2" /></div>
      <div>
        <h3>ប្រវត្តិកំណែសេចក្តីព្រាង</h3>
        <p>តាមដានការកែសម្រួល និងវិវត្តន៍នៃសេចក្តីព្រាងតាមកំណែនីមួយៗ</p>
      </div>
      <span class="history-count">{{ ws.draftVersions.length }} កំណែ</span>
    </div>

    <div v-if="ws.draftVersions.length === 0" class="empty-state">មិនទាន់មានប្រវត្តិកំណែ</div>

    <ol v-else class="timeline">
      <li v-for="(v, i) in ws.draftVersions" :key="v.id" class="timeline-entry">
        <div class="timeline-rail">
          <div class="version-badge" :class="{ current: i === 0 }">v{{ v.version_number }}</div>
          <div v-if="i < ws.draftVersions.length - 1" class="timeline-connector" />
        </div>

        <div class="timeline-card" :class="{ current: i === 0 }">
          <div class="timeline-card-head">
            <div class="status-group">
              <span class="status-pill" :class="v.status === 'final' ? 'is-final' : 'is-progress'">
                <component :is="v.status === 'final' ? CheckCircle2 : Clock3" :size="12" :stroke-width="2.6" />
                {{ v.status === 'final' ? 'ចុងក្រោយ' : 'កំពុងដំណើរការ' }}
              </span>
              <span v-if="i === 0" class="current-pill">កំណែបច្ចុប្បន្ន</span>
            </div>
            <router-link :to="{ name: 'DraftViewer', params: { meeting_id: meeting.id, draft_id: v.id } }" class="view-btn">
              មើលសេចក្តីព្រាង
            </router-link>
          </div>

          <p class="timeline-message">{{ v.message }}</p>

          <div class="timeline-card-foot">
            <span class="actor">
              <UserRound :size="13" :stroke-width="2.3" />
              {{ v.actor }}
            </span>
          </div>
        </div>
      </li>
    </ol>
  </div>
</template>

<style scoped>
.history-tab {
  min-width: 0;
  max-width: 720px;
  margin: 0 auto;
}

.history-head {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 24px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--color-border-soft);
}

.history-head-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  flex: none;
  color: var(--color-primary);
  background: #e6f0fd;
  border-radius: 12px;
}

.history-head h3 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 17px;
  font-weight: 400;
  color: var(--color-text);
}

.history-head p {
  margin: 3px 0 0;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.history-count {
  margin-left: auto;
  flex: none;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 700;
  color: var(--color-primary-hover);
  background: #e6f0fd;
  border-radius: 999px;
}

.timeline {
  display: grid;
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}

.timeline-entry {
  display: flex;
  gap: 16px;
}

.timeline-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: none;
}

.version-badge {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  font-size: 12px;
  font-weight: 800;
  color: var(--color-text-secondary);
  background: #fff;
  border: 2px solid var(--color-border);
  border-radius: 50%;
  box-shadow: var(--shadow-sm);
}

.version-badge.current {
  color: #fff;
  background: var(--color-primary);
  border-color: var(--color-primary);
  box-shadow: 0 0 0 4px rgba(13, 98, 213, 0.14);
}

.timeline-connector {
  width: 2px;
  flex: 1;
  margin: 4px 0;
  background: linear-gradient(var(--color-border-soft), var(--color-border-soft)) center / 2px 100% no-repeat;
}

.timeline-card {
  flex: 1;
  min-width: 0;
  margin-bottom: 20px;
  padding: 16px 18px;
  background: #fff;
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-md);
  transition: border-color var(--transition), box-shadow var(--transition), transform var(--transition);
}

.timeline-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.timeline-card.current {
  border-color: rgba(13, 98, 213, 0.35);
  background: linear-gradient(180deg, #f5f9ff 0%, #fff 60%);
}

.timeline-card-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.status-group {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 700;
  border-radius: 999px;
}

.status-pill.is-final {
  color: #1c7a44;
  background: #e7f8ee;
}

.status-pill.is-progress {
  color: #92660a;
  background: #fdf3d8;
}

.current-pill {
  padding: 3px 10px;
  font-size: 11px;
  font-weight: 700;
  color: var(--color-primary);
  background: #fff;
  border: 1px solid var(--color-primary);
  border-radius: 999px;
}

.view-btn {
  flex: none;
  padding: 6px 14px;
  font-size: 12px;
  font-weight: 700;
  color: var(--color-primary);
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  transition: all var(--transition);
}

.view-btn:hover {
  color: #fff;
  background: var(--color-primary);
  border-color: var(--color-primary);
}

.timeline-message {
  margin: 0 0 12px;
  font-size: 13.5px;
  color: var(--color-text);
  line-height: 1.7;
}

.timeline-card-foot {
  display: flex;
  align-items: center;
  padding-top: 10px;
  border-top: 1px solid var(--color-border-soft);
}

.actor {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
}
</style>
