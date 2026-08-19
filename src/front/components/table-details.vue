<script setup lang="ts">
  import Help from "./help.vue";
  import {useTablesStore} from "../stores/tables-store";
  import {Card, Divider, Chip, DataTable, Column, Button} from "primevue";
  import {CheckCircle, TimesCircle, ExclamationCircle, Refresh, Table} from '@primeicons/vue'
  import {onMounted, computed} from "vue";
  import {useDatasourcesStore} from "../stores/datasource-store";
  import TableLocks from "./table-stats/table-locks.vue";

  const props = defineProps({
    tableName: {
      type: String,
      required: true
    }
  });

  const tablesStore = useTablesStore();
  const datasourceStore = useDatasourcesStore();

  const sizeStats = computed(() => tablesStore.tableStats?.size);
  const rowsStats = computed(() => tablesStore.tableStats?.rowsStats);
  const ioStats = computed(() => tablesStore.tableStats?.ioStats);
  const indexesStats = computed(() => tablesStore.tableStats?.indexesStats);
  const locks = computed(() => tablesStore.tableStats?.locks);

  onMounted(() => {
    console.log(props.tableName, tablesStore.tableStats?.size);
  })

  function reloadDetails() {
    tablesStore.getTableStats(datasourceStore.datasourceChoosen!.id, props.tableName)
  }

  function formatQuantity(n: number) {
    return n.toLocaleString('en-US', {
      notation: "compact",
      compactDisplay: "short"
    })
  }

  function formatDate(date: Date) {
    if(date == null) return "-";
    return date.toLocaleString();
  }

  const diskCacheHitRatio = computed(() => {
    if(ioStats == null) return null;
    if(ioStats.value.cacheIndexBlocksRead === 0 && ioStats.value.cachediskBlocksRead === 0) return 0;
    const result = ioStats.value.cacheIndexBlocksRead / (ioStats.value.cacheIndexBlocksRead + ioStats.value.cachediskBlocksRead) * 100;
    return Math.round(result);
  })

</script>

<template>
  <div class="flex-col justify-center align-top mx-2">
    <div class="my-5">
      <div class="flex justify-between items-center">
        <span class="table-title text-2xl font-light flex items-center gap-2"><Table :size="20" />{{ tableName }}</span>
        <Button severity="info" @click="reloadDetails"><Refresh />Reload</Button>
      </div>
      <Divider />
    </div>

    <Card class="mt-2 mb-10 border-2 border-gray-200">
      <template #title>
        <div class="flex justify-between items-start">
          <span class="section-title">General</span>
          <Chip class="bg-green-50! dark:bg-green-950! text-green-700! dark:text-green-300!">
            <template #icon><CheckCircle /></template>
          </Chip>
        </div>
      </template>
      <template #content>
        <Divider />
        <div class="main-infos py-2 px-4 flex flex-col justify-items-start gap-5">
          <div class="flex justify-items-start items-center gap-5 w-full">
            <span class="title flex-1 flex items-center">Last analyze<Help model="ANALYZE" /></span>
            <span v-if="rowsStats && rowsStats.lastAnalyze">{{formatDate((rowsStats.lastAnalyze))}}</span>
          </div>
          <div class="flex justify-items-start items-center gap-5 w-full">
            <span class="title flex-1 flex items-center">Last Vacuum<Help model="VACUUM" /></span>
            <span class="flex items-center gap-2">
              <Help model="BLOAT" v-if="!rowsStats.lastVacuum && rowsStats.deadRows >= 0">
                <template #activator="{showHelp}">
                  <Chip @click="showHelp" v-tooltip.bottom="'Potential BLOAT'" class="bg-orange-100! text-orange-700!">
                    <template #icon><ExclamationCircle /></template>
                  </Chip>
                </template>
              </Help>
              <span v-if="rowsStats">{{formatDate((rowsStats.lastVacuum))}}</span>
            </span>
          </div>
          <div class="flex justify-items-start items-center gap-5 w-full">
            <span class="title flex-1 flex items-center">Sequential scans<Help model="SEQ_SCAN" /></span>
            <span v-if="ioStats">{{ioStats.sequentialScan}}</span>
          </div>
        </div>
      </template>
    </Card>

    <div class="flex items-start gap-4">
      <Card class="w-2/4 my-2" style="height: stretch" v-if="sizeStats">
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

      <Card class="w-2/4 my-2" style="height: stretch" v-if="rowsStats">
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
      <Card class="w-full my-2" v-if="ioStats">
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
                <span class="text-lg w-full text-center">Shared buffers <Help model="TEST" /></span>
                <div class="flex justify-center">
                  <div class="flex flex-col justify-center items-center">
                    <span class="text-3xl text-orange-800">{{diskCacheHitRatio}}</span>
                    <span>Cache hit ratio (%)</span>
                  </div>
                </div>
              </div>

              <div class="data flex-1 flex flex-col justify-center">
                <span class="text-lg w-full text-center">Data blocks</span>
                <div class="flex justify-center">
                  <div class="flex flex-col justify-center items-center">
                    <span class="text-3xl text-orange-800">{{formatQuantity(ioStats.diskBlocksRead)}}</span>
                    <span>Disk read</span>
                  </div>
                  <Divider layout="vertical" />
                  <div class="flex flex-col justify-center items-center">
                    <span class="text-3xl text-lime-700">{{formatQuantity(ioStats.cachediskBlocksRead)}}</span>
                    <span>Cache read</span>
                  </div>
                </div>
              </div>

              <div class="indexes-io flex-1 flex flex-col justify-center">
                <span class="text-lg w-full text-center">Indexes blocks</span>
                <div class="flex justify-center">
                  <div class="flex flex-col justify-center items-center">
                    <span class="text-3xl text-orange-800">{{formatQuantity(ioStats.indexBlocksRead)}}</span>
                    <span>Disk read</span>
                  </div>
                  <Divider layout="vertical" />
                  <div class="flex flex-col justify-center items-center">
                    <span class="text-3xl text-lime-700">{{formatQuantity(ioStats.cacheIndexBlocksRead)}}</span>
                    <span>Cache read</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>

    <Card class="w-full my-2" v-if="indexesStats">
      <template #title>
        <div class="flex justify-between items-start">
          <span class="section-title">Indexes ({{indexesStats.length}})</span>
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
              <Column field="scansTime" header="Scans">
                <template #body="{data}">
                  <div class="flex gap-2">
                    <span>{{data.scansTime}}</span>
                    <Chip v-if="data.scansTime === 0" v-tooltip.bottom="'Unused index'" class="bg-orange-100! text-orange-700!">
                      <template #icon><ExclamationCircle /></template>
                    </Chip>
                  </div>
                </template>
              </Column>
            </DataTable>
          </div>
        </div>
      </template>
    </Card>

    <TableLocks v-if="locks" :locks="locks" />

    <span>{{tablesStore.tableStats}}</span>
  </div>
</template>

<style scoped>
  .table-title, .section-title {
    font-family: 'consolas';
    font-family: 'menlo';
  }

  .section-title {
    font-weight: bold;
  }

  .content {
    padding: 1rem;
  }
</style>
