import { createRouter, createWebHistory } from 'vue-router'
import PortalPage from '@/components/PortalPage.vue'
import { usePortalStore } from '@/stores/portal'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/portal',
    },
    {
      path: '/portal',
      name: 'portal',
      component: PortalPage,
    },
    {
      path: '/meeting-viewer',
      name: 'meeting-viewer',
      component: () => import('@/views/MeetingViewer.vue'),
    },
    {
      path: '/viewer-calendar',
      name: 'viewer-calendar',
      component: () => import('@/components/calendar/ViewerCalendar.vue'),
    },
    {
      path: '/attendance',
      name: 'attendance',
      component: () => import('@/views/Attendance.vue'),
    },
    {
      path: '/guide',
      name: 'guide',
      component: () => import('@/views/GuideParticipant.vue'),
    },
    {
      path: '/draft/:meeting_id/:draft_id',
      name: 'DraftViewer',
      component: () => import('@/views/DraftViewer.vue'),
    },
  ],
})

router.beforeEach((to, from) => {
  const portalStore = usePortalStore()
  if (!portalStore.hasAccess && to.name !== 'portal') {
    return { name: 'portal' }
  }
})

export default router
