import { createApp } from 'vue'
import {pinia, router, PrimeVueConfig} from "./plugins.ts";
// @ts-ignore
import App from './App.vue'
import {Tooltip} from "primevue";
import ToastService from "primevue/toastservice";
import PrimeVue from "primevue/config";
import posthog from "posthog-js";
import './index.css';

const app = createApp(App)

const POSTHOG_TOKEN = import.meta.env.VITE_POSTHOG_KEY;
if(POSTHOG_TOKEN) {
    posthog.init(POSTHOG_TOKEN, {
        api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://eu.i.posthog.com',
        defaults: '2026-05-30',
    });
}

app.use(PrimeVue, PrimeVueConfig)
app.directive('tooltip', Tooltip)
app.use(ToastService)
app.use(pinia)
app.use(router)

app.mount('#app')

app.config.errorHandler = (err, instance, info) => {
    posthog.captureException(err)
}
