import {defineStore} from "pinia";
import {IpcUtils} from "./ipc-utils";
import {IpcRoutes} from "../../commons/ipc-routes";
import {ParameterDto} from "../../commons/data/dto/parameter-dto";
import {ParametersEnum} from "../../commons/data/dto/parameters-enum";

export const useSettingsStore = defineStore('settingsStore', {
    state: () => ({
        items: [] as ParameterDto[],
        availableCountries: [] as {name: string, code: string}[]
    }),
    actions: {
        getAll() {
            return IpcUtils.send(IpcRoutes.PARAMETERS_GET_ALL)
                .then((res) => this.items = res);
        },
        getAvailableCountries() {
            return IpcUtils.send(IpcRoutes.PARAMETERS_GET_AVAILABLE_COUNTRIES)
                .then((res) => this.availableCountries = res)
        },
        update(code: ParametersEnum, value: string) {
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
