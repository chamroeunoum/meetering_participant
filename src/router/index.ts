import { createRouter, createWebHistory } from 'vue-router'
import PortalPage from '@/components/PortalPage.vue'
import { usePortalStore } from '@/stores/portal'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
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
      component: () => import('@/views/ViewerCalendar.vue'),
    },
    {
      path: '/attendance',
      name: 'attendance',
      component: () => import('@/views/Attendance.vue'),
    },
    {
      path: '/writer',
      name: 'writer',
      component: () => import('@/views/Writer.vue'),
    },
    {
      path: '/administrator',
      name: 'administrator',
      component: () => import('@/views/Administrator.vue'),
    },
    {
      path: '/guide',
      name: 'guide',
      component: () => import('@/views/GuideParticipant.vue'),
    },
  ],
})

router.beforeEach((to, from) => {
  const portalStore = usePortalStore()
  // If user hasn't entered an access code and isn't going to the portal page, redirect to /
  if (!portalStore.hasAccess && to.name !== 'portal') {
    return { name: 'portal' }
  }
})

export default router
