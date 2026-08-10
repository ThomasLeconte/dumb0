<script setup lang="ts">
import {useDatasourcesStore} from "../../stores/datasource-store";
import {onMounted} from "vue";

const datasourceStore = useDatasourcesStore();
onMounted(() => {
  datasourceStore.loadDatasourceDetails().datasourceDetails;
})

</script>

<template>
  <div class="general h-dvh p-4 bg-gray-50 dark:bg-gray-700">
    <span class="title">General {{datasourceStore.datasourceDetails}}</span>
  </div>
</template>

<style scoped>
</style>