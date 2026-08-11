<script setup lang="ts">
import {useDatasourcesStore} from "../../stores/datasource-store";
import {computed, onBeforeMount, onMounted} from "vue";
import {Box, ExclamationCircle, Indent, ListOl, ListTree, Table} from "@primeicons/vue";
import {Card, Chip, Column, DataTable, Divider} from "primevue";

const datasourceStore = useDatasourcesStore();

const datasourceDetails = computed(() => datasourceStore.datasourceDetails);
const connections = computed(() => datasourceDetails.value?.connections);
const locks = computed(() => datasourceDetails.value?.locks);

</script>

<template>
  <div class="general p-4 min-h-dvh bg-gray-50">
    <div class="mb-8">
      <span class="title text-2xl">General</span>
      <Divider />
    </div>

    <div class="details mt-4">
      <div class="main-stats flex justify-between flex-wrap gap-4 mt-4 mb-12">
        <Card class="flex-1" style="background-color: var(--p-stone-100)">
          <template #title>
            <span class="title flex justify-start items-center gap-2"><Table size="20" />Tables</span>
            <Divider style="color: var(--p-zinc-500)" />
          </template>
          <template #content>
            <span class="text-xl font-light">{{datasourceDetails.stats.tablesCount}}</span>
          </template>
        </Card>
        <Card class="flex-1" style="background-color: var(--p-stone-100)">
          <template #title>
            <span class="title flex justify-start items-center gap-2"><ListTree size="20" />Indexes</span>
            <Divider />
          </template>
          <template #content>
            <span class="text-xl font-light">{{datasourceDetails.stats.indexesCount}}</span>
          </template>
        </Card>
        <Card class="flex-1" style="background-color: var(--p-stone-100)">
          <template #title>
            <span class="title flex justify-start items-center gap-2"><ListOl size="20" />Sequences</span>
            <Divider />
          </template>
          <template #content>
            <span class="text-xl font-light">{{datasourceDetails.stats.sequencesCount}}</span>
          </template>
        </Card>
        <Card class="flex-1" style="background-color: var(--p-stone-100)">
          <template #title>
            <span class="title flex justify-start items-center gap-2"><Box size="20" />Size</span>
            <Divider />
          </template>
          <template #content>
            <span class="text-xl font-light">{{datasourceDetails.stats.size}}</span>
          </template>
        </Card>
      </div>

      <Card class="w-full my-4">
        <template #title>
          <div class="flex justify-between items-start">
            <span class="section-title">Connections ({{connections.length}})</span>
            <Chip class="bg-orange-100! dark:bg-orange-950! text-orange-700! dark:text-orange-300!">
              <template #icon><ExclamationCircle /></template>
            </Chip>
          </div>
        </template>
        <template #content>
          <Divider />
          <div class="flex">
            <div class="flex justify-evenly w-full mt-4">
              <DataTable :value="datasourceDetails.connections" stripedRows class="w-full">
                <Column field="username" header="Username">
                  <template #body="{ data }">
                    <span class="font-medium">{{ data.username }}</span>
                  </template>
                </Column>
                <Column field="applicationName" header="Application name" />
                <Column field="cacheIndexBlocksRead" header="Cache read" />
                <Column field="ipAdress" header="IP Address" />
                <Column field="startDate" header="Start date" />
              </DataTable>
            </div>
          </div>
        </template>
      </Card>

      <Card class="w-full my-4">
        <template #title>
          <div class="flex justify-between items-start">
            <span class="section-title">Locks ({{locks?.length || 0}})</span>
            <Chip class="bg-orange-100! dark:bg-orange-950! text-orange-700! dark:text-orange-300!">
              <template #icon><ExclamationCircle /></template>
            </Chip>
          </div>
        </template>
        <template #content>
          <Divider />
          <div class="flex">
            <div class="flex justify-evenly w-full mt-4">
              <DataTable :value="locks" stripedRows class="w-full">
                <Column field="mode" header="Mode" />
                <Column field="username" header="Username" />
                <Column field="applicationName" header="Application" />
                <Column field="queryStart" header="Query start" />
              </DataTable>
            </div>
          </div>
        </template>
      </Card>
    </div>

    {{datasourceDetails}}
  </div>
</template>

<style scoped>
</style>