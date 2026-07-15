import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// Supress non-critical PDF viewer warnings (JBIG2 decoder wasm fallback)
const origWarn = console.warn
console.warn = (...args: any[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : ''
  if (
    msg.includes('JBig2') ||
    msg.includes('jbig2') ||
    msg.includes('wasmUrl') ||
    msg.includes('Dependent image')
  ) return
  origWarn(...args)
}

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
