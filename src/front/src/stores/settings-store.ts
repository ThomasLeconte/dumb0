import {defineStore} from "pinia";
import {api} from "../api/axios.ts";
import {ParameterDto} from "../../../commons/data/dto/parameter-dto.ts";
import {ParametersEnum} from "../../../commons/data/dto/parameters-enum.ts";
import posthog from "posthog-js";

export const useSettingsStore = defineStore('settingsStore', {
    state: () => ({
        items: [] as ParameterDto[],
        availableCountries: [] as {name: string, code: string}[],
        autoRefreshIntervalId: null as number | null,
        isRefreshing: false,
    }),
    actions: {
        fetchAll() {
            return Promise.all([this.getAll(), this.getAvailableCountries()])
        },
        getAll() {
            return api.get('/api/settings')
                .then((res) => this.items = res.data);
        },
        getAvailableCountries() {
            return api.get('/api/settings/countries')
                .then((res) => this.availableCountries = res.data)
        },
        update(code: ParametersEnum, value: string) {
            return api.put('/api/settings', {code: code.toString(), value})
                .then((res) => this.getAll());
        },
        
        startAutoRefresh(callback: () => Promise<void>) {
            this.stopAutoRefresh();
            
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
                    throw error;
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
        },

        initPostHogTelemetry() {
            const POSTHOG_TOKEN = import.meta.env.VITE_POSTHOG_KEY;
            if(POSTHOG_TOKEN) {
                posthog.init(POSTHOG_TOKEN, {
                    api_host: 'https://eu.i.posthog.com',
                    defaults: '2026-05-30',
                    disable_session_recording: true
                });
            } else {
                console.error("Unable to start telemetry, Posthog token not provided!");
            }
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
