import {defineStore} from "pinia";
import {computed, ref} from "vue";
import {useSettingsStore} from "./settings-store";
import {ParametersEnum} from "../../commons/data/dto/parameters-enum";
import {useToast} from "primevue";

export const useAutoRefreshStore = defineStore('autoRefreshStore', {
    state: () => ({
        intervalId: null as NodeJS.Timeout | null,
        isRefreshing: false,
    }),
    actions: {
        startAutoRefresh(callback: () => Promise<void>) {
            this.stopAutoRefresh();
            
            const settingsStore = useSettingsStore();
            const toast = useToast();
            
            const autoRefreshEnabled = settingsStore.getByCode(ParametersEnum.AUTO_REFRESH);
            const autoRefreshInterval = settingsStore.getByCode(ParametersEnum.AUTO_REFRESH_INTERVAL);
            
            if (!autoRefreshEnabled?.value || autoRefreshEnabled.value === 'false') {
                return;
            }
            
            const interval = parseInt(autoRefreshInterval?.value || '5000', 10);
            
            this.intervalId = setInterval(async () => {
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
            if (this.intervalId) {
                clearInterval(this.intervalId);
                this.intervalId = null;
            }
            this.isRefreshing = false;
        },
        
        refreshParameters() {
            const settingsStore = useSettingsStore();
            return settingsStore.getAll();
        },
        
        restartAutoRefresh(callback: () => Promise<void>) {
            this.stopAutoRefresh();
            this.startAutoRefresh(callback);
        }
    },
    getters: {
        isEnabled: (state) => {
            const settingsStore = useSettingsStore();
            const param = settingsStore.getByCode(ParametersEnum.AUTO_REFRESH);
            return param?.value === 'true';
        },
        interval: (state) => {
            const settingsStore = useSettingsStore();
            const param = settingsStore.getByCode(ParametersEnum.AUTO_REFRESH_INTERVAL);
            return parseInt(param?.value || '5000', 10);
        },
        isActive: (state) => {
            return state.intervalId !== null;
        }
    }
});
