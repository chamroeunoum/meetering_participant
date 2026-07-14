<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePortalStore } from '@/stores/portal'

const router = useRouter()
const portalStore = usePortalStore()

const step = ref('rooms')

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
      <span>មគ្គុទេសក៍ទីតាំង</span>
    </div>
    <main class="page-content">
      <div class="card">
        <div class="card-header">
          <span class="card-title">មគ្គុទេសក៍អ្នកចូលរួម</span>
        </div>
        <div class="card-body">
          <div class="empty-state">មើលរបៀបប្រើប្រាស់ និងជំនួយសម្រាប់អ្នកចូលរួម</div>
        </div>
      </div>
    </main>
  </div>
</template>
