import PrimeVue from 'primevue/config';
import {createPinia} from "pinia";
import router from './router'

const pinia = createPinia();

export {
    PrimeVue,
    pinia,
    router
}