import {defineStore} from "pinia";

export const useAppStore = defineStore('appStore', {
    actions: {
        setTitle(title: string) {
            document.title = `DUMBØ - ${title}`;
        }
    }
})
