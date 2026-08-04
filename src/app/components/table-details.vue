<script setup lang="ts">
  import {useTablesStore} from "../stores/tables-store";
  import {Card, Divider, Chip} from "primevue";
  import {CheckCircle, TimesCircle} from '@primeicons/vue'
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

  onMounted(() => {
    console.log(props.tableName, tablesStore.tableStats?.size);
  })

</script>

<template>
  <div class="flex-col justify-center align-top">
    <Card class="mb-10">
      <template #title>{{tableName}}</template>
    </Card>

    <div class="flex items-start gap-2">
      <Card class="w-2/4 my-2" v-if="sizeStats">
        <template #title>
          <div class="flex justify-between items-start">
            <span>Size</span>
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
            <span>Rows</span>
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

    <span>{{tablesStore.tableStats}}</span>
  </div>
</template>

<style scoped>
  .content {
    padding: 1rem;
  }
</style>
