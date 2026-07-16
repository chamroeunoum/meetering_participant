# API Authentication Flow

## Overview

The system uses **Laravel Passport** (OAuth2) for API authentication. The Vue frontend authenticates as an **Officer user**, receives a Bearer token, and uses it for all subsequent API calls.

---

## 1. Existing Auth Infrastructure

### Backend (Laravel)

| Component | Status |
|---|---|
| `config/auth.php` | ✅ API guard configured with `passport` driver |
| Passport migrations | ✅ Already installed and migrated |
| `AuthController` | ✅ Has `login()`, `signup()`, `logout()`, `user()` methods |
| Auth routes | ✅ `POST api/meeting/login`, `POST api/meeting/logout`, `GET api/meeting/user` |
| `auth:api` middleware | ✅ Ready to use on protected routes |

### AuthController Endpoints

```
POST /api/meeting/login         → { email, password } → { token, user }
POST /api/meeting/signup        → { firstname, lastname, email, phone, password } → { token, user }
POST /api/meeting/logout        → (Bearer token) → 200 OK
GET  /api/meeting/user          → (Bearer token) → { user }
```

### Login Response Format

```json
{
  "success": true,
  "message": "បានចូលប្រើប្រាស់ប្រព័ន្ធដោយជោគជ័យ",
  "token": "eyJ0eXAiOiJKV1Qi...",
  "token_type": "Bearer",
  "expires_at": "2026-08-14 16:35:00",
  "user": {
    "id": 1,
    "name": "រដ្ឋបាល",
    "email": "admin@ocm.gov.kh",
    ...
  }
}
```

---

## 2. Frontend Auth Flow

### Flow Diagram

```
Officer opens /officer/login
        │
        ▼
Enter email + password
        │
        ▼
POST /api/meeting/login
        │
        ├── Success → Store token in Pinia + localStorage
        │              Redirect to /officer/invitations
        │
        └── Error   → Show error message
```

### Pinia Auth Store

**New file: `src/stores/auth.ts`**

```typescript
export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('api_token') || '')
  const user = ref<any>(null)
  const isAuthenticated = computed(() => !!token.value)

  async function login(email: string, password: string) { ... }
  async function logout() { ... }
  function setToken(t: string) { ... }
})
```

### API Service

**New file: `src/utils/api.ts`** — Axios instance with automatic Bearer token:

```typescript
const api = axios.create({ baseURL: '/api/meeting' })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('api_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Token expired → redirect to login
      localStorage.removeItem('api_token')
      window.location.href = '/officer/login'
    }
    return Promise.reject(err)
  }
)
```

---

## 3. Frontend Components

### OfficerLogin.vue — `/officer/login`

A login page for officers with:
- Email field
- Password field
- "ចូលប្រើប្រាស់" button
- Error message display
- On success: stores token, redirects to `/officer/invitations`

### Route Guard

Update `router/index.ts` to protect `/officer/*` routes:

```typescript
// In router.beforeEach
if (to.path.startsWith('/officer') && to.name !== 'officer-login') {
  if (!authStore.isAuthenticated) {
    return { name: 'officer-login' }
  }
}
```

The `/officer/login` route is unprotected (anyone can access it).

---

## 4. API Integration (after auth)

Once authenticated, the OfficerInvitations page calls:

| Action | API Call |
|---|---|
| Load participants | `GET /api/meeting/{id}/invitations` |
| Generate codes | `POST /api/meeting/{id}/invitations/generate-codes` |
| Mark sent | `POST /api/meeting/{id}/invitations/mark-sent/{memberId}` |
| Get stats | `GET /api/meeting/{id}/invitations/stats` |

All calls include `Authorization: Bearer {token}` header automatically via the Axios interceptor.

---

## 5. Implementation Files

### Backend (Laravel) — Already exists

| File | Purpose |
|---|---|
| `app/Http/Controllers/Api/Meeting/AuthController.php` | Login/signup/logout |
| `app/Models/User.php` | User model with passport tokens |
| `config/auth.php` | Passport API guard config |
| `routes/api/meeting.php` (lines 30-40) | Login/logout/user routes |

### Frontend (Vue) — Need to create

| File | Purpose |
|---|---|
| `src/stores/auth.ts` | Pinia store for token + user |
| `src/utils/api.ts` | Axios instance with auth interceptor |
| `src/views/OfficerLogin.vue` | Login page UI |
| `src/router/index.ts` | Add officer login route + guard |

---

## 6. Implementation Order

```
Step 1: src/utils/api.ts          — Axios instance with Bearer token
Step 2: src/stores/auth.ts        — Pinia auth store (login, logout, token)
Step 3: src/views/OfficerLogin.vue — Login page
Step 4: src/router/index.ts       — Add route + guard
Step 5: Update OfficerInvitations — Use API instead of local data
Step 6: Update CheckIn.vue        — Use API verifyCode endpoint
```
