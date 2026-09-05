import {defineStore} from "pinia";
import {IpcUtils} from "./ipc-utils";
import {IpcRoutes} from "../../commons/ipc-routes";
import {ParameterDto} from "../../commons/data/dto/parameter-dto";
import {ParametersEnum} from "../../commons/data/dto/parameters-enum";
import {useToast} from "primevue";

export const useSettingsStore = defineStore('settingsStore', {
    state: () => ({
        items: [] as ParameterDto[],
        availableCountries: [] as {name: string, code: string}[],
        autoRefreshIntervalId: null as NodeJS.Timeout | null,
        isRefreshing: false,
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
        },
        
        startAutoRefresh(callback: () => Promise<void>) {
            this.stopAutoRefresh();
            
            const toast = useToast();
            
            const autoRefreshEnabled = this.getByCode(ParametersEnum.AUTO_REFRESH);
            const autoRefreshInterval = this.getByCode(ParametersEnum.AUTO_REFRESH_INTERVAL);
            
            if (!autoRefreshEnabled?.value || autoRefreshEnabled.value === 'false') {
                return;
            }
            
            const interval = parseInt(autoRefreshInterval?.value || '5000', 10);
            
            this.autoRefreshIntervalId = setInterval(async () => {
                this.isRefreshing = true;
                try {
                    await callback();
                } catch (error) {
                    toast.add({
                        severity: "error",
                        summary: "Auto-refresh error",
                        detail: error instanceof Error ? error.message : "Unknown error",
                        life: 3000,
                    });
                } finally {
                    this.isRefreshing = false;
                }
            }, interval);
        },
        
        stopAutoRefresh() {
            if (this.autoRefreshIntervalId) {
                clearInterval(this.autoRefreshIntervalId);
                this.autoRefreshIntervalId = null;
            }
            this.isRefreshing = false;
        },
        
        restartAutoRefresh(callback: () => Promise<void>) {
            this.stopAutoRefresh();
            this.startAutoRefresh(callback);
        }
    },
    getters: {
        getByCode: (state) => {
            return (code: ParametersEnum) => state.items.find((item) => item.code === code.toString());
        },
        isAutoRefreshEnabled: (state) => {
            const param = state.items.find((item) => item.code === ParametersEnum.AUTO_REFRESH.toString());
            return param?.value === 'true';
        },
        autoRefreshInterval: (state) => {
            const param = state.items.find((item) => item.code === ParametersEnum.AUTO_REFRESH_INTERVAL.toString());
            return parseInt(param?.value || '5000', 10);
        },
        isAutoRefreshActive: (state) => {
            return state.autoRefreshIntervalId !== null;
        }
    }
});
