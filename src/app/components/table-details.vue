<script setup lang="ts">
  import {useTablesStore} from "../stores/tables-store";
  import {Card, Divider, Chip, DataTable, Column} from "primevue";
  import {CheckCircle, TimesCircle, ExclamationCircle} from '@primeicons/vue'
  import {onMounted, computed} from "vue";

  const props = defineProps({
    tableName: {
      type: String,
      required: true
    }
  });

  const tablesStore = useTablesStore();

  const sizeStats = computed(() => tablesStore.tableStats?.size);
  const rowsStats = computed(() => tablesStore.tableStats?.rowsStats);
  const ioStats = computed(() => tablesStore.tableStats?.ioStats);
  const indexesStats = computed(() => tablesStore.tableStats?.indexesStats);

  onMounted(() => {
    console.log(props.tableName, tablesStore.tableStats?.size);
  })

</script>

<template>
  <div class="flex-col justify-center align-top mx-2">
    <div class="text-2xl font-light my-5 table-title">
      {{ tableName }}
      <Divider />
    </div>

    <div class="flex items-start gap-2">
      <Card class="w-2/4 my-2" v-if="sizeStats">
        <template #title>
          <div class="flex justify-between items-start">
            <span class="section-title">Size</span>
            <Chip class="bg-green-50! dark:bg-green-950! text-green-700! dark:text-green-300!">
              <template #icon><CheckCircle /></template>
            </Chip>
          </div>
        </template>
        <template #content>
          <Divider />
          <div class="content">
            <div>
              <div class="flex flex-col justify-center align-top">
                <div class="text-3xl flex justify-center align-middle">
                  {{sizeStats.total}}
                </div>
                <div class="flex justify-evenly w-full mt-4">
                  <div class="flex flex-col justify-center items-center">
                    <span class="text-xl">{{sizeStats.dataSize}}</span>
                    <span>Data</span>
                  </div>
                  <Divider layout="vertical" />
                  <div class="flex flex-col justify-center items-center">
                    <span class="text-xl">{{sizeStats.indexSize}}</span>
                    <span>Indexes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </Card>

      <Card class="w-2/4 my-2" v-if="rowsStats">
        <template #title>
          <div class="flex justify-between items-start">
            <span class="section-title">Rows</span>
            <Chip class="bg-red-50! dark:bg-red-950! text-red-700! dark:text-red-300!">
              <template #icon><TimesCircle /></template>
            </Chip>
          </div>
        </template>
        <template #content>
          <Divider />
          <div class="content">
            <div>
              <div class="flex justify-evenly w-full mt-4">
                <div class="flex flex-col justify-center items-center">
                  <span class="text-3xl text-lime-700">{{rowsStats.activeRows}}</span>
                  <span>Actives</span>
                </div>
                <Divider layout="vertical" />
                <div class="flex flex-col justify-center items-center">
                  <span class="text-3xl text-orange-800">{{rowsStats.deadRows}}</span>
                  <span>Dead</span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <div class="flex items-start gap-2">
      <Card class="w-full my-2" v-if="rowsStats">
        <template #title>
          <div class="flex justify-between items-start">
            <span class="section-title">I/O</span>
            <Chip class="bg-orange-100! dark:bg-orange-950! text-orange-700! dark:text-orange-300!">
              <template #icon><ExclamationCircle /></template>
            </Chip>
          </div>
        </template>
        <template #content>
          <Divider />
          <div class="flex">
            <div class="flex justify-evenly w-full mt-4">
              <div class="data flex-1 flex flex-col justify-center">
                <span class="text-lg w-full text-center">Data blocks</span>
                <div class="flex justify-center">
                  <div class="flex flex-col justify-center items-center">
                    <span class="text-3xl text-orange-800">{{ioStats.diskBlocksRead}}</span>
                    <span>Disk read</span>
                  </div>
                  <Divider layout="vertical" />
                  <div class="flex flex-col justify-center items-center">
                    <span class="text-3xl text-lime-700">{{ioStats.cachediskBlocksRead}}</span>
                    <span>Cache read</span>
                  </div>
                </div>
              </div>
              <div class="indexes-io flex-1 flex flex-col justify-center">
                <span class="text-lg w-full text-center">Indexes blocks</span>
                <div class="flex justify-center">
                  <div class="flex flex-col justify-center items-center">
                    <span class="text-3xl text-orange-800">{{ioStats.indexBlocksRead}}</span>
                    <span>Disk read</span>
                  </div>
                  <Divider layout="vertical" />
                  <div class="flex flex-col justify-center items-center">
                    <span class="text-3xl text-lime-700">{{ioStats.cacheIndexBlocksRead}}</span>
                    <span>Cache read</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <div class="flex items-start gap-2">
      <Card class="w-full my-2" v-if="indexesStats">
        <template #title>
          <div class="flex justify-between items-start">
            <span class="section-title">Indexes</span>
            <Chip class="bg-orange-100! dark:bg-orange-950! text-orange-700! dark:text-orange-300!">
              <template #icon><ExclamationCircle /></template>
            </Chip>
          </div>
        </template>
        <template #content>
          <Divider />
          <div class="flex">
            <div class="flex justify-evenly w-full mt-4">
              <DataTable :value="indexesStats" stripedRows class="w-full">
                <Column field="name" header="Name">
                  <template #body="{ data }">
                    <span class="font-medium">{{ data.name }}</span>
                  </template>
                </Column>
                <Column field="indexBlocksRead" header="Disk read" />
                <Column field="cacheIndexBlocksRead" header="Cache read" />
              </DataTable>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <span>{{tablesStore.tableStats}}</span>
  </div>
</template>

<style scoped>
  .table-title, .section-title {
    font-family: 'consolas';
  }

  .section-title {
    font-weight: bold;
  }

  .content {
    padding: 1rem;
  }
</style>
