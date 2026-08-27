import {IpcRoutes} from "../../commons/ipc-routes";

export class IpcUtils {
    static send(route: IpcRoutes, data?: any) {
        return window.ipc.send(route, data) as Promise<any>;
    }
}
