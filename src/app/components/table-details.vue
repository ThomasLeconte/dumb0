<script setup lang="ts">
  import {useTablesStore} from "../stores/tables-store";
  import {Card, Divider} from "primevue";
  import {onMounted, computed} from "vue";
  import {TableSizeDto} from "../../commons/data/dto/table-size-dto";

  const props = defineProps({
    tableName: {
      type: String,
      required: true
    }
  });

  const tablesStore = useTablesStore();

  onMounted(() => {
    console.log(props.tableName, tablesStore.tableStats.size, tablesStore.tableStats._size)
  })

</script>

<template>
  <div class="flex justify-center">
    <Card class="w-full h-full">
      <template #title>{{tableName}}</template>
      <template #content>
        <Divider />
        <div class="content">
          <div class="stats-block size-stats" v-if="sizeStats">
            <div class="stats-block-title">Size</div>
            <div class="stats-block-content">
              {{sizeStats.total}}
              {{sizeStats.dataSize}}
              {{sizeStats.indexSize}}
            </div>
          </div>

          <span>{{tablesStore.tableStats}}</span>
        </div>
      </template>
    </Card>
  </div>
</template>

<style scoped>
  .content {
    padding: 1rem;
  }
</style>
