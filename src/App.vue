<script setup lang="ts">
import { usePortalStore } from '@/stores/portal'
import AccessCodePage from '@/components/AccessCodePage.vue'
import PortalPage from '@/components/PortalPage.vue'

const portalStore = usePortalStore()
</script>

<template>
  <AccessCodePage v-if="!portalStore.hasAccess" />
  <template v-else>
    <router-view />
  </template>
</template>

<style>
/* ===== Global Styles ===== */

@import url('https://fonts.googleapis.com/css2?family=Battambang:wght@400;700&family=Inter:wght@400;500;600;700;800;900&family=Noto+Sans+Khmer:wght@400;500;600;700&family=Noto+Serif+Khmer:wght@400;700&display=swap');

:root {
  --font-heading: "Noto Serif Khmer", "Battambang", "Noto Sans Khmer", system-ui, sans-serif;
  --font-body: "Inter", "Noto Sans Khmer", "Battambang", "Segoe UI", system-ui, sans-serif;
  --color-primary: #0D62D5;
  --color-primary-hover: #0A4FAF;
  --color-accent: #D4AF37;
  --color-accent-pale: #F6E7A1;
  --color-danger: #EF4444;
  --color-danger-light: #fdecea;
  --color-success: #22C55E;
  --color-warning: #F59E0B;
  --color-text: #1B2142;
  --color-text-secondary: #64748B;
  --color-border: #E5E7EB;
  --color-border-soft: #E8EEF5;
  --color-bg: #F5F8FC;
  --color-bg-card: #FFFFFF;
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 8px 30px rgba(15,23,42,0.06);
  --shadow-lg: 0 18px 46px rgba(15,23,42,0.13);
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 20px;
  --transition: 300ms ease;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

html,
body,
#app {
  min-height: 100%;
}

body {
  margin: 0;
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.7;
  color: var(--color-text);
  background: var(--color-bg);
  -webkit-font-smoothing: antialiased;
}

a {
  color: inherit;
  text-decoration: none;
}

button,
input {
  font: inherit;
}

button {
  cursor: pointer;
}

.card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-soft);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.page-eyebrow {
  margin: 0;
  color: #3E4A67;
  font-family: var(--font-body);
  font-size: 20px;
  font-weight: 600;
  line-height: 1.35;
}

.access-title,
.portal-header h1 {
  font-family: var(--font-heading);
  font-weight: 700;
  letter-spacing: 0;
}

.form-group {
  display: grid;
  gap: 8px;
}

.form-label {
  font-weight: 700;
}

.form-input {
  width: 100%;
  min-height: 46px;
  padding: 10px 12px;
  color: var(--color-text);
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.form-input:focus {
  border-color: var(--color-primary);
  outline: 3px solid rgba(217, 154, 0, 0.16);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 40px;
  padding: 8px 16px;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  font-weight: 700;
  transition: all var(--transition);
}

.btn-primary {
  color: #fff;
  background: var(--color-primary);
}

.btn-primary:hover {
  background: var(--color-primary-hover);
}

.btn-secondary {
  color: var(--color-primary);
  background: #fff;
  border-color: var(--color-primary);
}

.btn-secondary:hover {
  background: rgba(217, 154, 0, 0.06);
  border-color: var(--color-primary-hover);
  color: var(--color-primary-hover);
}

.embedded-portal {
  min-height: 100vh;
  background: var(--color-bg);
}

.embedded-toolbar {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 12px 18px;
  background: rgba(255, 255, 255, 0.94);
  border-bottom: 1px solid var(--color-border);
  backdrop-filter: blur(10px);
}

.embedded-toolbar span {
  color: var(--color-text-secondary);
  font-weight: 800;
}

.embedded-toolbar-integrated {
  position: static;
  width: min(1440px, calc(100% - 32px));
  margin: 16px auto 0;
  border: 1px solid var(--color-border);
  border-radius: 18px;
  box-shadow: var(--shadow-sm);
}

.embedded-loading {
  width: min(520px, calc(100% - 32px));
  margin: 48px auto;
  padding: 28px;
  text-align: center;
  color: var(--color-text-secondary);
  font-weight: 800;
}

.page-content {
  width: min(1200px, 100%);
  margin: 0 auto;
  padding: 20px 24px 40px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border-soft);
}

.card-title {
  font-family: var(--font-heading);
  font-size: 17px;
  font-weight: 400;
  color: var(--color-text);
}

.card-body {
  padding: 20px;
}

.empty-state {
  padding: 32px 16px;
  color: var(--color-text-secondary);
  text-align: center;
}
</style>
