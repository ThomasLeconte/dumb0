import { createApp } from 'vue';
import App from './front/App.vue';
import {pinia, PrimeVue, router} from './front/plugins';
import Aura from '@primeuix/themes/aura';
import { usePreset, definePreset } from '@primeuix/themes';

import './front/index.css'
import {Tooltip} from "primevue";

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
        },
        license: 'eyJpZCI6ImFjYmRmYzQ2LWRkMzItNDlkZS1iMDc5LTNkMTBlY2Q4NjI2ZiIsInByb2R1Y3QiOiJwcmltZXVpIiwidGllciI6ImNvbW11bml0eSIsInR5cGUiOiJkZXYiLCJpYXQiOjE3ODU0NDEyNTUsImV4cCI6MTgxNjk3NzI1NX0.Rdye1VoNXFUPU5stcssIi8LsVA0DKRx6L4HpD4USeRJBAILqdQQubAjYmdHQAopXd-z3hGpo9CchWQQDkXuPBA'
    })
    .use(pinia)
    .use(router)
    .mount('#app');
