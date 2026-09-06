<script setup lang="ts">
import {computed} from "vue";
import {useSettingsStore} from "../stores/settings-store";
import {Refresh} from "@primeicons/vue";
import {Button} from "primevue";

const settingsStore = useSettingsStore();

const isEnabled = computed(() => settingsStore.isAutoRefreshEnabled);
const interval = computed(() => settingsStore.autoRefreshInterval);
const isActive = computed(() => settingsStore.isAutoRefreshActive);
const isRefreshing = computed(() => settingsStore.isRefreshing);

const tooltipText = computed(() => {
  if (!isEnabled.value) {
    return "Auto-refresh: OFF";
  }
  return `Auto-refresh: ON (${interval.value}ms)`;
});

const iconClass = computed(() => {
  if (!isEnabled.value) {
    return "text-gray-400";
  }
  if (isRefreshing.value) {
    return "text-green-500 animate-spin";
  }
  return "text-green-500";
});
</script>

<template>
  <div v-tooltip.bottom="tooltipText" class="flex items-center justify-center p-2 cursor-default">
    <Chip ><Refresh :class="iconClass" :size="20" /></Chip>
  </div>
</template>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
