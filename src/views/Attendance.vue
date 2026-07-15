<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePortalStore } from '@/stores/portal'
import { ArrowLeft, Check, Search, ShieldCheck, UserRoundCheck, X } from 'lucide-vue-next'
import { getParticipantIdForCode, participants, type Participant } from '@/data/participants'

const router = useRouter()
const portalStore = usePortalStore()
const verifiedParticipantIds = ref<number[]>([])
const feedback = ref<{ type: 'success' | 'error'; text: string } | null>(null)
const searchQuery = ref('')

const filteredParticipants = computed(() => {
  const query = searchQuery.value.trim().toLocaleLowerCase()

  if (!query) return participants

  return participants.filter((participant) =>
    [participant.name, participant.position, participant.department].some((value) =>
      value.toLocaleLowerCase().includes(query),
    ),
  )
})

function goBack() {
  portalStore.clearActivePortal()
  router.push('/portal')
}

function verifyParticipant(participant: Participant) {
  if (verifiedParticipantIds.value.includes(participant.id)) {
    feedback.value = {
      type: 'success',
      text: `${participant.name} បានផ្ទៀងផ្ទាត់រួចហើយ។`,
    }
    return
  }

  const participantIdForCode = getParticipantIdForCode(portalStore.accessCode)

  if (participant.id !== participantIdForCode) {
    feedback.value = {
      type: 'error',
      text: 'គណនីដែលបានចូល មិនត្រូវនឹងអ្នកចូលរួមដែលបានជ្រើសរើសទេ។',
    }
    return
  }

  verifiedParticipantIds.value.push(participant.id)
  feedback.value = {
    type: 'success',
    text: `${participant.name} បានផ្ទៀងផ្ទាត់ការចូលរួមដោយជោគជ័យ។`,
  }
}

function handleImageError(event: Event) {
  const image = event.currentTarget as HTMLImageElement
  image.hidden = true
  image.nextElementSibling?.removeAttribute('hidden')
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

    <main class="service-content">
      <section class="participant-panel" aria-labelledby="participant-list-title">
        <div class="panel-heading">
          <div class="panel-title-wrap">
            <div class="panel-icon" aria-hidden="true">
              <UserRoundCheck :size="24" :stroke-width="2" />
            </div>
            <div>
              <h2 id="participant-list-title">បញ្ជីអ្នកចូលរួម</h2>
              <p>ជ្រើសរើសឈ្មោះរបស់អ្នក ដើម្បីផ្ទៀងផ្ទាត់ការចូលរួម។</p>
            </div>
          </div>
          <span class="participant-count">
            {{
              searchQuery.trim()
                ? `${filteredParticipants.length} / ${participants.length}`
                : participants.length
            }}
            នាក់
          </span>
        </div>

        <div class="search-toolbar">
          <label class="search-field" for="participant-search">
            <Search :size="19" :stroke-width="2" aria-hidden="true" />
            <span class="sr-only">ស្វែងរកអ្នកចូលរួម</span>
            <input
              id="participant-search"
              v-model="searchQuery"
              type="search"
              placeholder="ស្វែងរកតាមឈ្មោះ តួនាទី ឬអង្គភាព..."
              autocomplete="off"
            />
            <button
              v-if="searchQuery"
              class="clear-search"
              type="button"
              aria-label="សម្អាតការស្វែងរក"
              @click="searchQuery = ''"
            >
              <X :size="17" :stroke-width="2.5" />
            </button>
          </label>
        </div>

        <div
          v-if="feedback"
          :class="['verification-feedback', feedback.type]"
          role="status"
          aria-live="polite"
        >
          {{ feedback.text }}
        </div>

        <div class="participant-table-wrap">
          <table class="participant-table">
            <thead>
              <tr>
                <th scope="col">អ្នកចូលរួម</th>
                <th scope="col">តួនាទី</th>
                <th scope="col">អង្គភាព</th>
                <th scope="col">ស្ថានភាព</th>
                <th scope="col"><span class="sr-only">សកម្មភាព</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="participant in filteredParticipants" :key="participant.id">
                <td data-label="អ្នកចូលរួម">
                  <span class="table-person">
                    <span class="avatar-wrap">
                      <img
                        :src="participant.photo"
                        :alt="participant.name"
                        @error="handleImageError"
                      />
                      <span class="avatar-fallback" hidden aria-hidden="true">
                        {{ participant.name.slice(-2) }}
                      </span>
                    </span>
                    <strong>{{ participant.name }}</strong>
                  </span>
                </td>
                <td data-label="តួនាទី">{{ participant.position }}</td>
                <td data-label="អង្គភាព">{{ participant.department }}</td>
                <td data-label="ស្ថានភាព">
                  <span
                    :class="[
                      'attendance-status',
                      verifiedParticipantIds.includes(participant.id) ? 'verified' : 'pending',
                    ]"
                  >
                    <Check
                      v-if="verifiedParticipantIds.includes(participant.id)"
                      :size="14"
                      :stroke-width="3"
                    />
                    {{
                      verifiedParticipantIds.includes(participant.id)
                        ? 'បានផ្ទៀងផ្ទាត់'
                        : 'មិនទាន់ផ្ទៀងផ្ទាត់'
                    }}
                  </span>
                </td>
                <td data-label="សកម្មភាព" class="action-cell">
                  <button
                    class="verify-button"
                    type="button"
                    :disabled="verifiedParticipantIds.includes(participant.id)"
                    @click="verifyParticipant(participant)"
                  >
                    {{
                      verifiedParticipantIds.includes(participant.id)
                        ? 'បានផ្ទៀងផ្ទាត់'
                        : 'ផ្ទៀងផ្ទាត់'
                    }}
                  </button>
                </td>
              </tr>
              <tr v-if="filteredParticipants.length === 0" class="empty-results-row">
                <td class="empty-results-cell" colspan="5">
                  <Search :size="26" :stroke-width="1.8" aria-hidden="true" />
                  <strong>រកមិនឃើញអ្នកចូលរួម</strong>
                  <span>សូមពិនិត្យពាក្យស្វែងរក ហើយព្យាយាមម្តងទៀត។</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.service-page {
  width: 100%;
  max-width: 100%;
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
  width: 100%;
}

.participant-panel {
  overflow: hidden;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 22px 24px;
  border-bottom: 1px solid var(--color-border-soft);
}

.panel-title-wrap {
  display: flex;
  align-items: center;
  gap: 14px;
}

.panel-title-wrap h2 {
  margin: 0 0 3px;
  font-family: var(--font-heading);
  font-size: 19px;
  color: var(--color-text);
}

.panel-title-wrap p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.panel-icon {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 44px;
  height: 44px;
  color: var(--color-primary);
  background: rgba(13, 98, 213, 0.08);
  border-radius: 12px;
}

.participant-count {
  flex: 0 0 auto;
  padding: 5px 11px;
  color: var(--color-primary);
  background: rgba(13, 98, 213, 0.08);
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
}

.search-toolbar {
  padding: 16px 24px 0;
}

.search-field {
  display: flex;
  align-items: center;
  gap: 10px;
  width: min(460px, 100%);
  min-height: 44px;
  padding: 0 12px;
  color: var(--color-text-secondary);
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: 10px;
  transition:
    border-color var(--transition),
    box-shadow var(--transition);
}

.search-field:focus-within {
  color: var(--color-primary);
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(13, 98, 213, 0.1);
}

.search-field input {
  flex: 1;
  min-width: 0;
  padding: 9px 0;
  color: var(--color-text);
  background: transparent;
  border: 0;
  outline: 0;
}

.search-field input::placeholder {
  color: #94a3b8;
}

.search-field input::-webkit-search-cancel-button {
  display: none;
}

.clear-search {
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  width: 28px;
  height: 28px;
  padding: 0;
  color: var(--color-text-secondary);
  background: #f1f5f9;
  border: 0;
  border-radius: 50%;
}

.clear-search:hover {
  color: var(--color-text);
  background: #e2e8f0;
}

.verification-feedback {
  margin: 16px 24px 0;
  padding: 11px 14px;
  border: 1px solid transparent;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
}

.verification-feedback.success {
  color: #15803d;
  background: #f0fdf4;
  border-color: #bbf7d0;
}

.verification-feedback.error {
  color: #b91c1c;
  background: #fef2f2;
  border-color: #fecaca;
}

.participant-table-wrap {
  width: 100%;
  overflow-x: auto;
}

.participant-table {
  width: 100%;
  min-width: 0;
  border-collapse: collapse;
  color: var(--color-text);
  font-size: 14px;
}

.participant-table th,
.participant-table td {
  padding: 15px 18px;
  border-bottom: 1px solid var(--color-border-soft);
  text-align: left;
  vertical-align: middle;
}

.participant-table th {
  color: var(--color-text-secondary);
  background: #f8fafc;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.participant-table tbody tr {
  transition: background-color var(--transition);
}

.participant-table tbody tr:hover {
  background: rgba(13, 98, 213, 0.025);
}

.participant-table tbody tr:last-child td {
  border-bottom: 0;
}

.empty-results-cell {
  padding: 48px 20px !important;
  color: var(--color-text-secondary);
  text-align: center !important;
}

.empty-results-cell svg {
  display: block;
  margin: 0 auto 10px;
  color: #94a3b8;
}

.empty-results-cell strong,
.empty-results-cell span {
  display: block;
}

.empty-results-cell strong {
  margin-bottom: 3px;
  color: var(--color-text);
  font-size: 15px;
}

.empty-results-cell span {
  font-size: 13px;
}

.table-person {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 230px;
}

.table-person strong {
  font-weight: 700;
  line-height: 1.45;
}

.avatar-wrap {
  position: relative;
  flex: 0 0 auto;
  width: 46px;
  height: 46px;
  overflow: hidden;
  border: 2px solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 0 1px var(--color-border-soft);
}

.avatar-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-fallback {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  color: #fff;
  background: var(--color-primary);
  font-weight: 700;
}

.avatar-fallback[hidden] {
  display: none;
}

.attendance-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 9px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.attendance-status.pending {
  color: #a16207;
  background: #fef9c3;
}

.attendance-status.verified {
  color: #15803d;
  background: #dcfce7;
}

.action-cell {
  text-align: right !important;
}

.verify-button {
  min-width: 108px;
  padding: 8px 13px;
  color: #fff;
  background: var(--color-primary);
  border: 1px solid var(--color-primary);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  transition: all var(--transition);
}

.verify-button:hover:not(:disabled) {
  background: var(--color-primary-hover);
  border-color: var(--color-primary-hover);
  transform: translateY(-1px);
}

.verify-button:disabled {
  color: #15803d;
  background: #f0fdf4;
  border-color: #bbf7d0;
  cursor: default;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 640px) {
  .service-page {
    padding: 8px 16px 48px;
  }
  .service-header {
    flex-direction: column;
    align-items: flex-start;
  }
  .header-title {
    font-size: 18px;
  }

  .panel-heading {
    align-items: flex-start;
    padding: 18px 16px;
  }

  .panel-icon {
    display: none;
  }

  .participant-count {
    white-space: nowrap;
  }

  .search-toolbar {
    padding: 14px 16px 0;
  }

  .participant-table,
  .participant-table tbody,
  .participant-table tr,
  .participant-table td {
    display: block;
    width: 100%;
  }

  .participant-table thead {
    display: none;
  }

  .participant-table tr {
    padding: 14px 16px;
    border-bottom: 1px solid var(--color-border-soft);
  }

  .participant-table tbody tr:last-child {
    border-bottom: 0;
  }

  .participant-table td {
    display: grid;
    grid-template-columns: 92px minmax(0, 1fr);
    gap: 10px;
    padding: 7px 0;
    border: 0;
  }

  .participant-table td::before {
    content: attr(data-label);
    color: var(--color-text-secondary);
    font-size: 12px;
    font-weight: 700;
  }

  .participant-table td:first-child {
    display: block;
    padding-bottom: 12px;
  }

  .participant-table td:first-child::before {
    display: none;
  }

  .empty-results-row {
    padding: 0 !important;
  }

  .empty-results-cell {
    display: block !important;
    padding: 42px 16px !important;
  }

  .empty-results-cell::before {
    display: none;
  }

  .action-cell {
    display: block !important;
    padding-top: 10px !important;
    text-align: left !important;
  }

  .action-cell::before {
    display: none;
  }

  .verify-button {
    width: 100%;
  }

  .verification-feedback {
    margin: 14px 16px 0;
  }
}
</style>
