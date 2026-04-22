import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'

// Use i18n from @mlightcad/cad-viewer (official requirement)
import { i18n } from '@mlightcad/cad-viewer'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import App from './App.vue'
import './styles/main.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(ElementPlus)

app.mount('#app')
