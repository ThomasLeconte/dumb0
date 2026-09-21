import {IpcRoutes} from "../../commons/ipc-routes";

export class IpcUtils {
    static send(route: IpcRoutes, data?: any) {
        console.log(route, data)
        return window.ipc.send(route, data) as Promise<any>;
    }
}
