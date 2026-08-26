import {defineStore} from "pinia";

export const useAppStore = defineStore('appStore', {
    actions: {
        setTitle(title: string) {
            return window.ipc.send('set-window-title', {title: `DBAPP - ${title}`});
        }
    }
})