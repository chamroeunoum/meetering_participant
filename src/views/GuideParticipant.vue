<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePortalStore } from '@/stores/portal'
import { ArrowLeft, ArrowRight, MapPin } from 'lucide-vue-next'
import { rooms, doors, roomGuides, fallbackGuidePictures } from '@/data/meetingGuideData'

const route = useRoute()
const router = useRouter()
const portalStore = usePortalStore()

const step = ref<'rooms' | 'doors' | 'guide'>('rooms')
const selectedRoomId = ref('')
const selectedDoorId = ref('')
const pictureIndex = ref(0)
const swipeStartX = ref<number | null>(null)

onMounted(() => {
  const roomParam = route.query.room as string
  const found = rooms.find(r => r.id === roomParam)
  if (found) {
    selectedRoomId.value = roomParam
    selectedDoorId.value = 'door-1'
    pictureIndex.value = 0
    step.value = 'guide'
  }
})

const selectedRoom = computed(() => rooms.find(r => r.id === selectedRoomId.value))
const selectedDoor = computed(() => doors.find(d => d.id === selectedDoorId.value))

const guidePictures = computed(() => {
  if (!selectedRoom.value || !selectedDoorId.value) return fallbackGuidePictures
  const roomKey = selectedRoom.value.room
  const guides = (roomGuides as Record<string, any>)[roomKey]
  if (!guides) return fallbackGuidePictures
  return guides[selectedDoorId.value] || fallbackGuidePictures
})

const currentPicture = computed(() => guidePictures.value[pictureIndex.value] || {})

function selectRoom(id: string) {
  selectedRoomId.value = id
  selectedDoorId.value = ''
  pictureIndex.value = 0
  step.value = 'doors'
}

function selectDoor(id: string) {
  selectedDoorId.value = id
  pictureIndex.value = 0
  step.value = 'guide'
}

function prevPicture() {
  if (pictureIndex.value > 0) pictureIndex.value--
}
function nextPicture() {
  if (pictureIndex.value < guidePictures.value.length - 1) pictureIndex.value++
}

function onSwipeStart(e: PointerEvent) { swipeStartX.value = e.clientX }
function onSwipeEnd(e: PointerEvent) {
  if (swipeStartX.value === null) return
  const dist = e.clientX - swipeStartX.value
  swipeStartX.value = null
  if (Math.abs(dist) < 45) return
  dist < 0 ? nextPicture() : prevPicture()
}

function goBack() {
  if (step.value === 'doors') { step.value = 'rooms'; return }
  if (step.value === 'guide') { step.value = 'doors'; return }
  const from = route.query.from as string
  if (from === 'meeting-viewer') {
    portalStore.setActivePortal('meeting-viewer')
    router.push(`/meeting-viewer?id=${route.query.meetingId || 'm1'}`)
  } else {
    portalStore.clearActivePortal()
    router.push('/portal')
  }
}
</script>

<template>
  <div class="page-wrap">
    <header class="page-header-bar">
      <button class="back-btn" type="button" @click="goBack">
        <ArrowLeft :size="20" :stroke-width="2.5" />
        {{ step === 'guide' ? 'ត្រឡប់' : step === 'doors' ? 'ត្រឡប់' : 'ត្រឡប់' }}
      </button>
      <div class="h-center">
        <div class="h-icon"><MapPin :size="22" :stroke-width="2" /></div>
        <h1 class="h-title">មគ្គុទេសក៍ទីតាំង</h1>
      </div>
    </header>

    <!-- Step: Room Selection -->
    <main v-if="step === 'rooms'" class="content">
      <div class="s-head">
        <span class="s-badge">ជំហានទី ១</span>
        <h2 class="s-title">ជ្រើសរើសបន្ទប់ប្រជុំ</h2>
        <p class="s-desc">ជ្រើសរើសបន្ទប់ ដើម្បីមើលផ្លូវទៅកាន់បន្ទប់</p>
      </div>
      <div class="room-grid">
        <button v-for="room in rooms" :key="room.id" class="room-card" type="button" @click="selectRoom(room.id)">
          <img class="room-img" :src="room.image" :alt="room.name" />
          <div class="room-info">
            <strong>{{ room.name }}</strong>
            <span>{{ room.floor }} · {{ room.building }}</span>
          </div>
        </button>
      </div>
    </main>

    <!-- Step: Door Selection -->
    <main v-if="step === 'doors'" class="content">
      <div class="s-head">
        <span class="s-badge">ជំហានទី ២</span>
        <h2 class="s-title">ជ្រើសរើសទ្វារ</h2>
        <p class="s-desc">អ្នកបានជ្រើស {{ selectedRoom?.name }}។ សូមជ្រើសទ្វារដែលអ្នកចូលមក</p>
      </div>
      <div class="door-grid">
        <button v-for="door in doors" :key="door.id" class="door-card" type="button" @click="selectDoor(door.id)">
          <img class="door-img" :src="door.image" :alt="door.name" />
          <strong>{{ door.name }}</strong>
          <span>{{ door.hint }}</span>
        </button>
      </div>
    </main>

    <!-- Step: Photo Guide (sliding) -->
    <main v-if="step === 'guide'" class="content guide-content">
      <div class="guide-shell">
        <!-- Toolbar -->
        <div class="g-toolbar">
          <button class="round-btn" type="button" aria-label="រូបភាពមុន" @click="prevPicture" :disabled="pictureIndex === 0">‹</button>
          <div class="g-counter">
            <p>{{ selectedRoom?.name }}</p>
            <small>{{ selectedDoor?.name }}</small>
            <span>រូបភាពទី {{ pictureIndex + 1 }} / {{ guidePictures.length }}</span>
          </div>
          <button class="round-btn" type="button" aria-label="រូបភាពបន្ទាប់" @click="nextPicture" :disabled="pictureIndex >= guidePictures.length - 1">›</button>
        </div>

        <!-- Photo frame with swipe -->
        <div class="photo-frame" @pointerdown="onSwipeStart" @pointerleave="swipeStartX = null" @pointerup="onSwipeEnd">
          <img v-if="currentPicture.src" :src="currentPicture.src" :alt="currentPicture.title || ''" />
        </div>

        <!-- Step text -->
        <div class="g-copy">
          <p class="g-kicker">{{ selectedRoom?.floor }}</p>
          <h3>{{ currentPicture.title || '' }}</h3>
          <p>{{ currentPicture.text || '' }}</p>
          <div class="step-dots">
            <button
              v-for="(pic, i) in guidePictures"
              :key="pic.src + i"
              :class="['dot-btn', { active: i === pictureIndex }]"
              type="button"
              :aria-label="`បង្ហាញរូបភាពទី ${i + 1}`"
              @click="pictureIndex = i"
            />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>

.page-wrap { width: 100%; padding: 8px 24px 48px; }

.page-header-bar { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 24px 0 20px; border-bottom: 1px solid var(--color-border-soft); margin-bottom: 24px; }
.back-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; font-size: 14px; font-weight: 600; color: var(--color-primary); background: rgba(255,255,255,0.8); border: 1px solid var(--color-border); border-radius: 10px; cursor: pointer; }
.back-btn:hover { background: #fff; border-color: var(--color-primary); }
.h-center { display: flex; align-items: center; gap: 10px; }
.h-icon { display: grid; place-items: center; width: 40px; height: 40px; color: var(--color-primary); background: rgba(13,98,213,0.08); border-radius: 10px; }
.h-title { margin: 0; font-family: var(--font-heading); font-size: 20px; font-weight: 700; color: var(--color-text); }

.content { padding-bottom: 24px; }

/* Step header */
.s-head { margin-bottom: 20px; }
.s-badge { display: inline-block; padding: 4px 10px; font-size: 12px; font-weight: 700; color: var(--color-accent); background: rgba(212,175,55,0.1); border-radius: 6px; margin-bottom: 8px; }
.s-title { margin: 0 0 6px; font-family: var(--font-heading); font-size: 22px; font-weight: 700; color: var(--color-text); }
.s-desc { margin: 0; font-size: 15px; color: var(--color-text-secondary); }

/* Room selection */
.room-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 14px; }
.room-card { display: grid; gap: 0; border-radius: 16px; overflow: hidden; background: rgba(255,255,255,0.8); backdrop-filter: blur(8px); border: 1px solid var(--color-border-soft); cursor: pointer; text-align: left; transition: all var(--transition); }
.room-card:hover { border-color: var(--color-primary); box-shadow: 0 4px 16px rgba(13,98,213,0.1); }
.room-img { width: 100%; height: 140px; object-fit: cover; }
.room-info { padding: 12px 14px; display: grid; gap: 2px; }
.room-info strong { font-size: 16px; font-weight: 700; color: var(--color-text); }
.room-info span { font-size: 13px; color: var(--color-text-secondary); }

/* Door selection */
.door-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; }
.door-card { display: grid; gap: 6px; padding: 16px; border-radius: 16px; background: rgba(255,255,255,0.8); backdrop-filter: blur(8px); border: 1px solid var(--color-border-soft); cursor: pointer; text-align: center; transition: all var(--transition); }
.door-card:hover { border-color: var(--color-primary); box-shadow: 0 4px 16px rgba(13,98,213,0.1); }
.door-img { width: 100%; height: 120px; object-fit: cover; border-radius: 10px; margin-bottom: 4px; }
.door-card strong { font-size: 15px; font-weight: 700; color: var(--color-text); }
.door-card span { font-size: 13px; color: var(--color-text-secondary); }

/* Guide slide */
.guide-content { display: grid; place-items: center; }
.guide-shell { max-width: 640px; width: 100%; background: rgba(255,255,255,0.8); backdrop-filter: blur(8px); border: 1px solid var(--color-border-soft); border-radius: 20px; overflow: hidden; box-shadow: var(--shadow-sm); }

.g-toolbar { display: flex; align-items: center; gap: 12px; padding: 14px 18px; border-bottom: 1px solid var(--color-border-soft); }
.round-btn { width: 38px; height: 38px; display: grid; place-items: center; border: 1px solid var(--color-border); border-radius: 50%; background: #fff; color: var(--color-primary); font-size: 22px; cursor: pointer; flex-shrink: 0; transition: all var(--transition); }
.round-btn:disabled { opacity: 0.3; cursor: default; }
.round-btn:hover:not(:disabled) { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
.g-counter { flex: 1; text-align: center; }
.g-counter p { margin: 0; font-size: 15px; font-weight: 700; color: var(--color-text); }
.g-counter small { font-size: 12px; color: var(--color-text-secondary); }
.g-counter span { display: block; font-size: 12px; color: var(--color-accent); margin-top: 2px; font-weight: 600; }

.photo-frame { width: 100%; min-height: 320px; background: #f0f2f5; display: grid; place-items: center; user-select: none; touch-action: none; }
.photo-frame img { width: 100%; height: auto; max-height: 420px; object-fit: contain; display: block; }

.g-copy { padding: 20px 24px 24px; text-align: center; }
.g-kicker { margin: 0 0 4px; font-size: 13px; font-weight: 700; color: var(--color-accent); text-transform: uppercase; letter-spacing: 1px; }
.g-copy h3 { margin: 0 0 8px; font-family: var(--font-heading); font-size: 18px; font-weight: 700; color: var(--color-text); }
.g-copy p:not(.g-kicker) { margin: 0; font-size: 15px; color: var(--color-text-secondary); line-height: 1.6; }

.step-dots { display: flex; justify-content: center; gap: 8px; margin-top: 16px; flex-wrap: wrap; }
.dot-btn { width: 10px; height: 10px; border-radius: 50%; border: none; background: #d1d5db; cursor: pointer; transition: all var(--transition); padding: 0; }
.dot-btn.active { background: var(--color-primary); width: 24px; border-radius: 5px; }

@media (max-width: 640px) {
  .page-wrap { padding: 8px 16px 48px; }
  .page-header-bar { flex-direction: column; align-items: flex-start; }
  .h-title { font-size: 17px; }
  .s-title { font-size: 19px; }
  .room-grid { grid-template-columns: 1fr; }
  .door-grid { grid-template-columns: 1fr; }
  .photo-frame { min-height: 220px; }
  .g-copy { padding: 16px; }
}
</style>
