import {defineStore} from "pinia";
import {IpcRoutes} from "../../commons/ipc-routes";
import {IpcUtils} from "./ipc-utils";

export const useAppStore = defineStore('appStore', {
    actions: {
        setTitle(title: string) {
            return IpcUtils.send(IpcRoutes.APP_SET_TITLE, {title: `DUMBØ - ${title}`});
        }
    }
})
