# Access Scenarios Plan

## Overview

Two distinct verification methods lead to different access levels — **both skip the portal entirely**:

```
Verification Page
├── Meeting Code ──→ Meeting Detail ONLY (targeted participant)
└── Phone/Email OTP ──→ Calendar → Meeting Detail (general user)
```

The portal page (`/portal`) is **not used** in either scenario. It exists only for future admin use.

---

## Scenario 1 — Meeting Code

### User Flow

1. Participant receives an invitation with a **unique code** (e.g., `M1-P01-A7K2`)
2. Goes to verification page → enters code in **"លេខកូដកិច្ចប្រជុំ"** tab
3. System looks up the code → finds the **meeting ID** and **participant ID**
4. Redirects **directly to `/meeting-viewer?id=m1`**
5. Only that specific meeting's detail page is accessible — no other routes

### Permissions

| Page | Access |
|---|---|
| `/meeting-viewer?id=...` | ✅ Yes (only the meeting they were invited to) |
| `/portal` | ❌ No |
| `/viewer-calendar` | ❌ No |
| `/attendance` | ❌ No |
| `/guide` | ❌ No |
| `/checkin` | ❌ No |

### UI State

- **Top bar**: Hidden (participant only sees the meeting detail page)
- **Back button**: Goes back to verification page (`/`)
- **No service navigation**: The meeting detail is the only view

---

## Scenario 2 — Phone/Email OTP

### User Flow

1. User verifies via phone or email → receives 6-digit OTP
2. Enters OTP → system grants access
3. Redirects **directly to `/viewer-calendar`** (not portal)
4. Calendar shows all meetings (month/year views, timeline)
5. **Single-click** on a meeting card → selects it, shows preview in side panel
6. **Click "មើលព័ត៌មានលម្អិត"** button in side panel → navigates to `/meeting-viewer?id=...`
7. Meeting detail page works the same as Scenario 1

### Permissions

| Page | Access |
|---|---|
| `/viewer-calendar` | ✅ Yes — landing page after OTP |
| `/meeting-viewer?id=...` | ✅ Yes (via calendar → detail navigation) |
| `/portal` | ❌ No |
| `/attendance` | ❌ No |
| `/guide` | ❌ No |
| `/checkin` | ✅ Yes (QR scan for on-site check-in) |

### Navigation Flow

```
[OTP success] → /viewer-calendar
                    │
                    ├── click meeting pill → select + side panel preview
                    │
                    └── click "មើលព័ត៌មានលម្អិត" → /meeting-viewer?id=m1
                                                                │
                                                                └── back → /viewer-calendar
```

---

## Implementation Changes

### 1. Store (`portal.ts`)

Add:
- `accessType: 'meeting-code' | 'contact' | null`
- `restrictedMeetingId: string`
- `setAccessType(type)`
- `getAccessType()`

### 2. Router Guard

Update `router.beforeEach`:

```typescript
if (accessType === 'meeting-code') {
  // Only allow /meeting-viewer
  if (to.name !== 'meeting-viewer') return { name: 'meeting-viewer', query: { id: restrictedMeetingId } }
}
if (accessType === 'contact') {
  // Allow calendar, meeting-viewer, checkin
  if (!['viewer-calendar', 'meeting-viewer', 'checkin'].includes(to.name as string)) {
    return { name: 'viewer-calendar' }
  }
}
```

### 3. AccessCodePage

| Tab | After success |
|---|---|
| **Meeting Code** | Look up code → get meetingId → `setAccessType('meeting-code')` → `router.push('/meeting-viewer?id=' + meetingId)` |
| **Phone/Email OTP** | `setAccessType('contact')` → `router.push('/viewer-calendar')` |

### 4. PortalPage

No changes needed — this page is **not used** in either scenario.

### 5. MeetingViewer

- Read `id` from `route.query.id` (already implemented)
- Back button behavior depends on `accessType`:
  - `meeting-code`: back to `/`
  - `contact`: back to `/viewer-calendar` (already implemented via `isFromCalendar`)

### Attendance / Check-in (both scenarios)

- **Check-in is only available on the meeting's scheduled date**
- If `meeting.date !== today` → the check-in button is **hidden**
- If `meeting.date === today` → the check-in button appears:
  - **Meeting Code scenario**: The participant is already identified by their unique code. The check-in button in MeetingViewer marks them as checked in.
  - **OTP scenario**: The user can either:
    - Click the check-in button in MeetingViewer (same as above), OR
    - Use the `/checkin` QR scanner route to scan a participant's unique code
- Attendance verification is **date-gated**: no one can check in before or after the meeting date

### 6. ViewerCalendar

- Already redirects to `/meeting-viewer?id=...` via the "មើលព័ត៌មានលម្អិត" button
- No changes needed

---

## Summary of Changes

| File | Change |
|---|---|
| `src/stores/portal.ts` | Add `accessType`, `restrictedMeetingId`, `setAccessType()` |
| `src/router/index.ts` | Update guard to check `accessType` before allowing routes |
| `src/components/AccessCodePage.vue` | Meeting Code → redirect to meeting detail; OTP → redirect to calendar |
| `src/views/MeetingViewer.vue` | Back button: already handles `isFromCalendar` for contact users |
| `src/views/ViewerCalendar.vue` | No changes needed (already navigates to meeting detail) |
