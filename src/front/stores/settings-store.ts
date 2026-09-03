import {defineStore} from "pinia";
import {TableStatsDto} from "../../commons/data/dto/table-stats-dto";
import {IpcUtils} from "./ipc-utils";
import {IpcRoutes} from "../../commons/ipc-routes";
import {ParameterDto} from "../../commons/data/dto/parameter-dto";
import {ParametersEnum} from "../../commons/data/dto/parameters-enum";

export const useSettingsStore = defineStore('settingsStore', {
    state: () => ({
        items: [] as ParameterDto[],
    }),
    actions: {
        getAll() {
            return IpcUtils.send(IpcRoutes.PARAMETERS_GET_ALL)
                .then((res) => this.items = res);
        },
        update(code: ParametersEnum, value: string) {
            console.log(code, code.toString())
            return IpcUtils.send(IpcRoutes.PARAMETERS_UPDATE_ITEM, {code: code.toString(), value})
                .then((res) => this.getAll());
        }
    },
    getters: {
        getByCode: (state) => {
            return (code: ParametersEnum) => state.items.find((item) => item.code === code.toString());
        }
    }
});
