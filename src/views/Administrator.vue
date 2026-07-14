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
      <span>រដ្ឋបាលការអញ្ជើញ</span>
    </div>
    <main class="page-content">
      <div class="card">
        <div class="card-header">
          <span class="card-title">អ្នកគ្រប់គ្រងប្រព័ន្ធ</span>
        </div>
        <div class="card-body">
          <div class="empty-state">គ្រប់គ្រងអ្នកប្រើប្រាស់ សិទ្ធិ និងការកំណត់ផ្សេងៗ</div>
        </div>
      </div>
    </main>
  </div>
</template>
