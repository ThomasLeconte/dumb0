import { createApp } from 'vue'
import {pinia, router, PrimeVueConfig} from "@/plugins.ts";
// @ts-ignore
import App from './App.vue'
import {Tooltip} from "primevue";
import ToastService from "primevue/toastservice";
import PrimeVue from "primevue/config";
import './index.css';

const app = createApp(App)

app.use(PrimeVue, PrimeVueConfig)
app.directive('tooltip', Tooltip)
app.use(ToastService)
app.use(pinia)
app.use(router)

app.mount('#app')
