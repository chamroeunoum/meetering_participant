<script setup lang="ts">
import { ref } from 'vue'
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
      <span>ចុះវត្តមានអ្នកចូលរួម</span>
    </div>
    <main class="page-content">
      <div class="card">
        <div class="card-header">
          <span class="card-title">ផ្ទៀងផ្ទាត់អ្នកចូលរួម</span>
        </div>
        <div class="card-body">
          <div class="empty-state">ផ្ទៀងផ្ទាត់ការចូលរួម និងព័ត៌មានអ្នកចូលរួម</div>
        </div>
      </div>
    </main>
  </div>
</template>
