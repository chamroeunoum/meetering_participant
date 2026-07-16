import { createRouter, createWebHistory } from 'vue-router'
import AccessCodePage from '@/components/AccessCodePage.vue'
import PortalPage from '@/components/PortalPage.vue'
import { usePortalStore } from '@/stores/portal'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'access',
      component: AccessCodePage,
    },
    {
      path: '/portal',
      name: 'portal',
      component: PortalPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/meeting-viewer',
      name: 'meeting-viewer',
      component: () => import('@/views/MeetingViewer.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/viewer-calendar',
      name: 'viewer-calendar',
      component: () => import('@/components/calendar/ViewerCalendar.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/attendance',
      name: 'attendance',
      component: () => import('@/views/Attendance.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/guide',
      name: 'guide',
      component: () => import('@/views/GuideParticipant.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/checkin',
      name: 'checkin',
      component: () => import('@/views/CheckIn.vue'),
    },
    {
      path: '/officer/login',
      name: 'officer-login',
      component: () => import('@/views/OfficerLogin.vue'),
    },
    {
      path: '/officer/invitations',
      name: 'officer-invitations',
      component: () => import('@/views/OfficerInvitations.vue'),
      meta: { requiresOfficerAuth: true },
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
  const authStore = useAuthStore()

  // Officer routes — require API Bearer token
  if (to.meta.requiresOfficerAuth && !authStore.isAuthenticated) {
    return { name: 'officer-login' }
  }

  // Participant portal — not logged in → redirect to verification
  if (to.meta.requiresAuth && !portalStore.hasAccess) {
    return { name: 'access' }
  }

  // Logged in via meeting code → only allow meeting-viewer
  if (portalStore.accessType === 'meeting-code' && to.name !== 'meeting-viewer') {
    return { name: 'meeting-viewer', query: { id: portalStore.restrictedMeetingId || 'm1' } }
  }

  // Logged in via contact → allow calendar, meeting-viewer, checkin only
  if (portalStore.accessType === 'contact') {
    const allowedRoutes = ['viewer-calendar', 'meeting-viewer', 'checkin']
    if (!allowedRoutes.includes(to.name as string)) {
      return { name: 'viewer-calendar' }
    }
  }
})

export default router
