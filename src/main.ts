import './assets/index.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedState from "pinia-plugin-persistedstate"
import App from './App.vue'
import router from './router'
const pinia = createPinia()
pinia.use(piniaPluginPersistedState)
const app = createApp(App)

app.use(pinia)
app.use(router)

app.mount('#app')
