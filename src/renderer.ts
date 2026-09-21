import { createApp } from 'vue';
import App from './front/App.vue';
import {pinia, PrimeVue, router} from './front/plugins';
import Aura from '@primeuix/themes/aura';
import { usePreset, definePreset } from '@primeuix/themes';

import './front/index.css'
import {Tooltip} from "primevue";
import ToastService from "primevue/toastservice";

// Use a preset as-is
usePreset(Aura);

createApp(App)
    .directive('tooltip', Tooltip)
    .use(PrimeVue, {
        theme: {
            preset: Aura,
            options: {
                darkModeSelector: false // Disables dark mode
            }
        }
    })
    .use(ToastService)
    .use(pinia)
    .use(router)
    .mount('#app');
