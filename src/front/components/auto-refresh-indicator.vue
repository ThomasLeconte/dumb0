<script setup lang="ts">
import {computed} from "vue";
import {useAutoRefreshStore} from "../stores/auto-refresh-store";
import {Refresh} from "@primeicons/vue";
import {Tooltip} from "primevue";

const autoRefreshStore = useAutoRefreshStore();

const isEnabled = computed(() => autoRefreshStore.isEnabled);
const interval = computed(() => autoRefreshStore.interval);
const isActive = computed(() => autoRefreshStore.isActive);
const isRefreshing = computed(() => autoRefreshStore.isRefreshing);

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
    return "text-blue-500 animate-spin";
  }
  return "text-blue-500";
});
</script>

<template>
  <Tooltip :target="() => $refs.indicator" :text="tooltipText" />
  <div ref="indicator" class="flex items-center justify-center p-2 cursor-default">
    <Refresh :class="iconClass" :size="20" />
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
