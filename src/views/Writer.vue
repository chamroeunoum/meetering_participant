<script setup lang="ts">
import { useRouter } from 'vue-router'
import { usePortalStore } from '@/stores/portal'

const router = useRouter()
const portalStore = usePortalStore()

function goBack() {
  portalStore.clearActivePortal()
  router.push('/')
}
</script>

<template>
  <div class="embedded-portal">
    <div class="embedded-toolbar">
      <button class="btn btn-secondary" type="button" @click="goBack">
        ត្រឡប់ទៅផ្ទាំងសេវាកម្ម
      </button>
      <span>កន្លែងរៀបចំអ្នកចូលរួម</span>
    </div>
    <main class="page-content">
      <div class="card">
        <div class="card-header">
          <span class="card-title">អ្នកសរសេរ</span>
        </div>
        <div class="card-body">
          <div class="empty-state">គ្រប់គ្រងកំណត់ត្រា ការប្រជុំ និងឯកសារ</div>
        </div>
      </div>
    </main>
  </div>
</template>
