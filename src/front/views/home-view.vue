<script setup lang="ts">
import {
  Card, Button, Divider, Carousel, CarouselPrev, Menu, CarouselNext, CarouselContent, CarouselItem } from "primevue";
import {Plus, Database, SignIn, Times, ChevronLeft, ChevronRight, Clone, Pencil, Bars} from '@primeicons/vue'
import {useDatasourcesStore} from "../stores/datasource-store";
import {computed, onBeforeMount, onMounted, ref, useTemplateRef} from "vue";
import {DatasourceDto} from "../../commons/data/dto/datasource-dto";
import {useRouter} from "vue-router";
import {useTablesStore} from "../stores/tables-store";

import UpsertDatasourceDialog from "../components/upsert-datasource-dialog.vue";
import {MenuItemCommandEvent} from "primevue/menuitem";
import DeleteDatasourceDialog from "../components/delete-datasource-dialog.vue";
import {useAppStore} from "../stores/app-store";
import {useSettingsStore} from "../stores/settings-store";

const appStore = useAppStore();
const tableStore = useTablesStore();
const datasourceStore = useDatasourcesStore();
const settingsStore = useSettingsStore();
const router = useRouter();

const createDialog = ref(false);
const updateDialog = ref(false);
const duplicateDialog = ref(false);
const deleteDialog = ref(false);
const datasourceToUpdateOrDelete = ref<DatasourceDto | null>(null);
const menuRef = useTemplateRef('menu');
const items = ref([
  {
    label: 'Update',
    icon: Pencil,
    command: () => {
      updateDialog.value = true;
    }
  },
  {
    label: 'Duplicate',
    icon: Clone,
    command: () => {
      if(!datasourceToUpdateOrDelete.value) return;
      datasourceToUpdateOrDelete.value = new DatasourceDto(
          null,
          datasourceToUpdateOrDelete.value.name,
          datasourceToUpdateOrDelete.value.username,
          datasourceToUpdateOrDelete.value.password,
          datasourceToUpdateOrDelete.value.hostname,
          datasourceToUpdateOrDelete.value.port,
          datasourceToUpdateOrDelete.value.dbname
      );
      duplicateDialog.value = true;
    }
  },
  {
    label: 'Delete',
    icon: Times,
    command: (evt: MenuItemCommandEvent) => {
      console.log(evt);
      deleteDialog.value = true;
    }
  },
]);

onBeforeMount(() => {
  Promise.all([settingsStore.getAll(), settingsStore.getAvailableCountries(), datasourceStore.getAll()])
      .then(() => appStore.setTitle('Connections'));
});

const datasources = computed(() => datasourceStore.datasources);

function connect(datasource: DatasourceDto) {
  datasourceStore.selectDatasource(datasource).then(() => {
    return tableStore.loadTables(datasource.id);
  }).finally(() => {
    router.push({name: 'general'});
  });
}

function toggle(event: any, datasource: DatasourceDto) {
  datasourceToUpdateOrDelete.value = datasource;
  if(menuRef.value) {
    menuRef.value[0]?.toggle(event)
  }
};

function showCreateDialog() {
  createDialog.value = true;
}

</script>

<template>
  <transition name="fade" mode="out-in" appear>
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

      <div class="flex justify-center items-start p-10 gap-4 min-w-8/12">
        <Carousel  class="w-full" align="center" loop autoSize :slidesPerPage="1.2">
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
            <div v-if="datasources && datasources.length === 0" class="flex flex-col justify-center items-center w-full h-full">
              <div class="text-xl font-light">No datasources yet</div>
              <div class="text-sm font-light">Create a new datasource to start</div>
              <Button severity="contrast" @click="showCreateDialog()" class="mt-4"><Plus />Create</Button>
            </div>

            <CarouselItem v-else v-for="(item, index) in datasources" :key="index" class="basis-16">
              <Card>
                <template #title>
                  <div class="flex justify-between items-center p-2 pb-0">
                    <Menu ref="menu" :model="items" popup />
                    <div class="flex items-center gap-2 title"><Database />{{item.name}}</div>
                    <Button severity="contrast" icon-only text @click="e => toggle(e, item)"><Bars /></Button>
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
  </transition>

  <UpsertDatasourceDialog v-model="createDialog" />
  <UpsertDatasourceDialog v-if="datasourceToUpdateOrDelete && updateDialog" v-model="updateDialog" :datasource="datasourceToUpdateOrDelete" />
  <UpsertDatasourceDialog v-if="datasourceToUpdateOrDelete && duplicateDialog" v-model="duplicateDialog" :datasource="datasourceToUpdateOrDelete" />
  <DeleteDatasourceDialog v-if="datasourceToUpdateOrDelete && deleteDialog" :datasource="datasourceToUpdateOrDelete" />
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

  /* Transition pour la page home */
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
</style>
