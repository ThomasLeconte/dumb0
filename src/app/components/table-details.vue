<script setup lang="ts">
  import {useTablesStore} from "../stores/tables-store";
  import {Card, Divider} from "primevue";
  import {onMounted} from "vue";

  const props = defineProps({
    tableName: {
      type: String,
      required: true
    }
  });

  const tablesStore = useTablesStore();

  onMounted(() => {
    console.log(props.tableName, tablesStore.tableStats)
  })

</script>

<template>
  <div class="flex justify-center">
    <Card class="w-full h-full">
      <template #title>{{tableName}}</template>
      <template #content>
        <Divider />
        <div class="content">
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