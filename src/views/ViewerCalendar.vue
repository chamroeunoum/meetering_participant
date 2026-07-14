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
      <span>ប្រតិទិនកិច្ចប្រជុំ</span>
    </div>
    <main class="page-content">
      <div class="card">
        <div class="card-header">
          <span class="card-title">ប្រតិទិនកិច្ចប្រជុំ</span>
        </div>
        <div class="card-body">
          <div class="empty-state">មើលកាលវិភាគកិច្ចប្រជុំ និងព័ត៌មានពាក់ព័ន្ធ</div>
        </div>
      </div>
    </main>
  </div>
</template>
