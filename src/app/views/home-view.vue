<script setup lang="ts">
import {Card, Button, Divider} from "primevue";
import {Plus, Database, SignIn} from '@primeicons/vue'
import {useDatasourcesStore} from "../stores/datasource-store";
import {computed, onMounted} from "vue";
import {DatasourceDto} from "../../commons/data/dto/datasource-dto";
import {useRouter} from "vue-router";
import {useTablesStore} from "../stores/tables-store";

const tableStore = useTablesStore();
const datasourceStore = useDatasourcesStore();
const router = useRouter();

onMounted(() => {
  datasourceStore.loadDatasources().then(() => {
    console.log(datasources.value)
  });
});

const datasources = computed(() => datasourceStore.datasources);

function connect(datasource: DatasourceDto) {
  datasourceStore.selectDatasource(datasource);
  tableStore.loadTables(datasource.id);
  router.push('tables');
}

</script>

<template>
  <div class="home-content w-full h-full min-h-dvh flex flex-col justify-center items-center">
    <div class="home-background"></div>
    <div class="title flex flex-col justify-center items-center">
      <div class="text-5xl title">DB-APP</div>
      <div class="text-xl">Your personal DBA for PostgreSQL 🐘</div>
    </div>

    <Card class="my-20" v-if="datasources.length === 0">
      <template #content>
        <span class="text-xl font-light">Datasources</span>
        <div class="databases-list p-10">
          <div class="border-dashed border-2 border-gray-400 rounded-lg p-10">
            <Button outlined severity="contrast"><Plus />Create</Button>
          </div>
        </div>
      </template>
    </Card>

    <div v-else class="flex justify-center items-start p-10 my-20">
      <Card v-for="(item, index) in datasources" :key="index">
        <template #title>
          <div class="flex items-center gap-2 title"><Database />{{item.name}}</div>
        </template>
        <template #content>
          <Divider />
          <div class="datasource-details">
            <span class="datasource-details-title title">Host</span>
            <span class="datasource-details-value">{{item.hostname}}</span>
          </div>
          <div class="datasource-details">
            <span class="datasource-details-title title">Port</span>
            <span class="datasource-details-value">{{item.port}}</span>
          </div>
          <div class="datasource-details">
            <span class="datasource-details-title title">Username</span>
            <span class="datasource-details-value">{{item.username}}</span>
          </div>
          <Divider />
        </template>
        <template #footer>
          <div class="flex justify-center">
            <Button @click="connect(item)"><SignIn />Connect</Button>
          </div>
        </template>
      </Card>
    </div>


  </div>
</template>

<style scoped>
  .home-background {
    background-color: #E5E5F7;
    opacity: 0.1;
    z-index: -9999;
    position: absolute;
    height: 100dvh;
    width: 100dvw;
    background-image:  repeating-radial-gradient( circle at 0 0, transparent 0, #E5E5F7 10px ), repeating-linear-gradient( #444CF755, #444CF7 );
  }

  .datasource-details {
    min-width: 15rem;
  }

  .datasource-details-title {
    display: inline-block;
    width: 10rem;
    text-align: left;
    font-weight: lighter;
  }

  .datasource-details-value {
    font-weight: lighter;
  }

  .title {
    font-family: 'consolas';
    font-family: 'menlo';
  }
</style>
