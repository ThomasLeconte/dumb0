<script setup lang="ts">
import {
  Button,
  Card,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrev,
  Divider,
  Menu
} from "primevue";
import {
  Bars,
  ChevronLeft,
  ChevronRight,
  Clone,
  Cog,
  Database,
  Github,
  Pencil,
  Plus,
  SignIn,
  Spinner,
  Times
} from '@primeicons/vue'
import {useDatasourcesStore} from "@/stores/datasource-store.ts";
import {computed, onMounted, ref, useTemplateRef} from "vue";
import {DatasourceDto} from "../../../commons/data/dto/datasource-dto.ts";
import {useRouter} from "vue-router";
import {useTablesStore} from "@/stores/tables-store.ts";

import UpsertDatasourceDialog from "../components/upsert-datasource-dialog.vue";
import DeleteDatasourceDialog from "../components/delete-datasource-dialog.vue";
import SettingsDialog from "../components/settings-dialog.vue";
import {useAppStore} from "@/stores/app-store.ts";
import {useSettingsStore} from "@/stores/settings-store.ts";
import {ParametersEnum} from "../../../commons/data/dto/parameters-enum.ts";
import posthog from "posthog-js";

const appStore = useAppStore();
const tableStore = useTablesStore();
const datasourceStore = useDatasourcesStore();
const settingsStore = useSettingsStore();
const router = useRouter();

const createDialog = ref(false);
const updateDialog = ref(false);
const duplicateDialog = ref(false);
const deleteDialog = ref(false);
const settingsDialog = ref(false);
const loading = ref(false);
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
          -1,
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
    command: (evt: any) => {
      console.log(evt);
      deleteDialog.value = true;
    }
  },
]);

onMounted(() => {
  loading.value = true;
  Promise.all([settingsStore.getAll(), settingsStore.getAvailableCountries(), datasourceStore.getAll()])
      .then(() => {
        appStore.setTitle('Connections');
        if(settingsStore.getByCode(ParametersEnum.TELEMETRY)?.value === 'true') {
          initPostHogTelemetry();
        }
      })
      .finally(() => loading.value = false);
});

const datasources = computed(() => datasourceStore.datasources);

function initPostHogTelemetry() {
  const POSTHOG_TOKEN = import.meta.env.VITE_POSTHOG_KEY;
  if(POSTHOG_TOKEN) {
    posthog.init(POSTHOG_TOKEN, {
      api_host: 'https://eu.i.posthog.com',
      defaults: '2026-05-30',
      session_recording: {
        canvasCapture: {
          resolutionScale: 0.2
        }
      }
    });
  } else {
    console.error("Unable to start telemetry, Posthog token not provided!");
  }
}

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
}

function goToGithub() {
  window.open("https://github.com/ThomasLeconte/dumb0", "_blank");
}

function showCreateDialog() {
  createDialog.value = true;
}

function showSettingsDialog() {
  settingsDialog.value = true;
}

</script>

<template>
  <transition name="fade" mode="out-in" appear>
    <div v-if="loading" class="flex h-dvh justify-center items-center">
      <Spinner size="48" />
    </div>

    <div v-else class="home-content w-full h-full min-h-dvh flex flex-col justify-center items-center">
      <div class="home-background"></div>

      <div class="absolute w-full top-0 p-2 flex justify-end gap-2">
        <Button iconOnly outlined severity="contrast" @click="goToGithub"><Github /></Button>
        <Button iconOnly outlined severity="contrast" @click="showSettingsDialog"><Cog /></Button>
      </div>

      <div class="title flex flex-col justify-center items-center">
        <div class="flex items-center my-4">
          <img src="/icon.png" width="125"/>
          <div class="text-6xl font-bold title">umb0</div>
        </div>
        <div class="text-xl">Manage your PostgreSQL database like a pro 🐘</div>
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
                    <span class="datasource-details-value ph-no-capture">{{item.hostname}}</span>
                  </div>
                  <div class="datasource-details">
                    <span class="datasource-details-title title">Port</span>
                    <span class="datasource-details-value ph-no-capture">{{item.port}}</span>
                  </div>
                  <div class="datasource-details">
                    <span class="datasource-details-title title">Schema</span>
                    <span class="datasource-details-value ph-no-capture">{{item.schema}}</span>
                  </div>
                  <div class="datasource-details">
                    <span class="datasource-details-title title">Username</span>
                    <span class="datasource-details-value ph-no-capture">{{item.username}}</span>
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

  <SettingsDialog v-model="settingsDialog" />
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
