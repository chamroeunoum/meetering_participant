<script setup lang="ts">
import { ref } from 'vue'
import { usePortalStore } from '@/stores/portal'
import { isValidPortalCode } from '@/data/access'

const portalStore = usePortalStore()
const code = ref('')
const error = ref('')

function submit(event: Event) {
  event.preventDefault()

  if (isValidPortalCode(code.value)) {
    error.value = ''
    portalStore.grantAccess(code.value.trim().toUpperCase())
    return
  }

  error.value = 'លេខកូដមិនត្រឹមត្រូវ។ សូមព្យាយាមម្តងទៀត។'
}
</script>

<template>
  <main class="access-page">
    <section class="access-card card">
      <div class="page-eyebrow">ការចូលប្រើសេវាអ្នកចូលរួម</div>
      <h1 class="access-title">បញ្ចូលលេខកូដប្រជុំ</h1>
      <p class="access-copy">
        សូមបញ្ចូលលេខកូដ ដើម្បីបើកផ្ទាំងសេវាកម្មសម្រាប់អ្នកចូលរួមកិច្ចប្រជុំ។
      </p>
      <form @submit="submit" class="access-form">
        <div class="form-group">
          <label class="form-label" for="meeting-code">លេខកូដប្រជុំ</label>
          <input
            id="meeting-code"
            class="form-input access-input"
            v-model="code"
            placeholder="បញ្ចូលលេខកូដ"
            autocomplete="off"
            autofocus
          />
        </div>
        <div v-if="error" class="access-error">{{ error }}</div>
        <button class="btn btn-primary access-button" type="submit">បញ្ជាក់</button>
      </form>
    </section>
  </main>
</template>

<style scoped>
.access-page {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
}

.access-card {
  width: min(520px, 100%);
  padding: 32px;
}

.access-title {
  font-size: 27px;
  line-height: 1.55;
  margin: 0 0 12px;
}

.access-copy {
  color: var(--color-text-secondary);
  margin: 0 0 24px;
}

.access-form {
  display: grid;
  gap: 12px;
}

.access-input {
  text-transform: uppercase;
}

.access-error {
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  background: var(--color-danger-light);
  color: var(--color-danger);
  font-weight: 700;
}

.access-button {
  width: 100%;
}
</style>
