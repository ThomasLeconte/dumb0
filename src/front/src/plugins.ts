import {createPinia} from "pinia";
import router from './router'
import Aura from '@primeuix/themes/aura';

const pinia = createPinia();

const primeVueLicenceKey = import.meta.env.VITE_PRIMEVUE_LICENCE_KEY;

const PrimeVueConfig = {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: false // Disables dark mode
        }
    },
    license: primeVueLicenceKey
}

export {
    PrimeVueConfig,
    pinia,
    router
}