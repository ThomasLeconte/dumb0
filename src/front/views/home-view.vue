<script setup lang="ts">
import {Card, Button, Divider, Carousel, CarouselPrev, CarouselNext, CarouselContent, CarouselItem, CarouselIndicators} from "primevue";
import {Plus, Database, SignIn, Times, ChevronLeft, ChevronRight} from '@primeicons/vue'
import {useDatasourcesStore} from "../stores/datasource-store";
import {computed, onMounted, ref} from "vue";
import {DatasourceDto} from "../../commons/data/dto/datasource-dto";
import {useRouter} from "vue-router";
import {useTablesStore} from "../stores/tables-store";
import CreateDatasourceDialog from "../components/create-datasource-dialog.vue";

const tableStore = useTablesStore();
const datasourceStore = useDatasourcesStore();
const router = useRouter();

const createDialog = ref(false);

onMounted(() => {
  datasourceStore.loadDatasources();
});

const datasources = computed(() => datasourceStore.datasources);

function connect(datasource: DatasourceDto) {
  datasourceStore.selectDatasource(datasource).then(() => {
    return tableStore.loadTables(datasource.id);
  }).finally(() => {
    router.push({name: 'general'});
  });
}

function showCreateDialog() {
  createDialog.value = true;
}

</script>

<template>
  <div class="home-content w-full h-full min-h-dvh flex flex-col justify-center items-center">
    <div class="home-background"></div>
    <div class="title flex flex-col justify-center items-center">
      <div class="text-5xl title">DB-APP</div>
      <div class="text-xl">Your personal DBA for PostgreSQL 🐘</div>
    </div>

    <div class="flex flex-col justify-center items-center w-6/12 mt-10">
      <div class="list-header flex justify-between items-center w-full">
        <span class="text-xl font-light">Datasources</span>
        <Button severity="contrast" @click="showCreateDialog()"><Plus />Create</Button>
      </div>
      <Divider />
    </div>

    <div class="flex justify-center items-start p-10 gap-4">
      <Carousel align="center" loop :slidesPerPage="1.8">
        <div class="flex items-center justify-between mb-4">
          <div class="font-bold">Last Used</div>
          <div class="flex items-center gap-2">
            <CarouselPrev :as="Button" size="small" severity="secondary" iconOnly>
              <ChevronLeft />
            </CarouselPrev>
            <CarouselNext :as="Button" size="small" severity="secondary" iconOnly>
              <ChevronRight />
            </CarouselNext>
          </div>
        </div>
        <CarouselContent>
          <CarouselItem v-for="(item, index) in datasources" :key="index" class="basis-16">
            <Card class="w-full">
              <template #title>
                <div class="flex justify-between items-center p-2 pb-0">
                  <div class="flex items-center gap-2 title"><Database />{{item.name}}</div>
                  <Button iconOnly outlined rounded severity="danger"><Times /></Button>
                </div>
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
          </CarouselItem>
        </CarouselContent>

      </Carousel>

    </div>
  </div>

  <CreateDatasourceDialog v-model="createDialog" />
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
</style>
