<script setup lang="ts">
import { computed } from 'vue'
import { useMeetingWorkspaceStore } from '@/stores/meetingWorkspace'
import { getRoomSeats, groupLabel, roleLabel, type Meeting } from '@/utils/data'

const props = defineProps<{ meeting: Meeting }>()

const workspace = useMeetingWorkspaceStore()
const ws = computed(() => workspace.getWorkspace(props.meeting.id))
const seats = computed(() => getRoomSeats(props.meeting.roomId))

const rows = computed(() => {
  const seatByParticipant = new Map<string, string>()
  Object.entries(ws.value.seatAssignments).forEach(([seatId, participantId]) => {
    const seat = seats.value.find((s) => s.id === seatId)
    if (seat) seatByParticipant.set(participantId, seat.seat_number)
  })
  return ws.value.participants.map((p) => ({
    ...workspace.resolveParticipant(props.meeting.id, p),
    seatNumber: seatByParticipant.get(p.id) || '',
  }))
})
</script>

<template>
  <div class="member-list-tab">
    <div class="member-list-toolbar">
      <h3>បញ្ជីសមាសភាព ({{ rows.length }} នាក់)</h3>
    </div>

    <div v-if="rows.length === 0" class="empty-state">មិនទាន់មានសមាសភាពប្រជុំ</div>

    <div v-else class="member-table-wrap">
      <table class="member-table">
        <thead>
          <tr>
            <th class="col-index">ល.រ</th>
            <th class="col-seat">កៅអី</th>
            <th>ឈ្មោះ</th>
            <th>តួនាទី</th>
            <th>ក្រុម</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in rows" :key="row.id">
            <td class="col-index">{{ index + 1 }}</td>
            <td class="col-seat">
              <span v-if="row.seatNumber" class="seat-badge">{{ row.seatNumber }}</span>
              <span v-else class="text-muted">—</span>
            </td>
            <td>
              <div class="member-name">{{ row.fullName }}</div>
              <div v-if="row.user?.organization" class="member-org">{{ row.user.organization }}</div>
            </td>
            <td><span class="role-badge">{{ roleLabel(row.role) }}</span></td>
            <td><span class="group-badge">{{ groupLabel(row.group) }}</span></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.member-list-tab {
  display: grid;
  gap: 16px;
}

.member-list-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.member-list-toolbar h3 {
  margin: 0;
  font-family: var(--font-heading);
  font-size: 18px;
  font-weight: 400;
}

.member-table-wrap {
  overflow-x: auto;
}

.member-table {
  width: 100%;
  border-collapse: collapse;
}

.member-table th {
  padding: 10px 12px;
  font-size: 12px;
  color: var(--color-text-secondary);
  text-align: left;
  border-bottom: 1px solid var(--color-border-soft);
}

.member-table td {
  padding: 10px 12px;
  font-size: 14px;
  border-bottom: 1px solid var(--color-border-soft);
  vertical-align: middle;
}

.col-index,
.col-seat {
  width: 56px;
}

.text-muted {
  color: var(--color-text-secondary);
}

.seat-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  font-size: 12px;
  font-weight: 700;
  color: var(--color-primary-hover);
  background: #e6f0fd;
  border-radius: 50%;
}

.member-name {
  font-weight: 700;
}

.member-org {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.role-badge {
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 700;
  color: #92660a;
  background: #fdf3d8;
  border-radius: 999px;
}

.group-badge {
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 700;
  color: var(--color-primary-hover);
  background: #e6f0fd;
  border-radius: 999px;
}
</style>
