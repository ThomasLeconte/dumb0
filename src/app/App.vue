<template>
  <Button @click="sendTest">Verify</Button>
  <TablesLayout></TablesLayout>
</template>

<script setup>
import Button from 'primevue/button';
import {useTablesStore} from "./stores/tables-store";
import TablesLayout from "./components/tables-layout.vue";

const tablesStore = useTablesStore();

async function sendTest() {
  console.log(window)
  tablesStore.loadTables();
}
</script>