<script setup lang="ts">
import {Database, Plus, Print, Search, SignOut, PenLine, Cog, Table, Play} from '@primeicons/vue';
import {Toolbar, Button, IconField, InputIcon, Menubar, ProgressBar, Toast} from "primevue";
import {useDatasourcesStore} from "@/stores/datasource-store.ts";
import {computed, onMounted, ref} from "vue";
import {useTablesStore} from "@/stores/tables-store.ts";
import {useRouter} from "vue-router";
import {useAppStore} from "@/stores/app-store.ts";
import AutoRefreshIndicator from "../../components/auto-refresh-indicator.vue";
import {useSettingsStore} from "@/stores/settings-store.ts";

const appStore = useAppStore();
const datasourceStore = useDatasourcesStore();
const settingsStore = useSettingsStore();
const tablesStore = useTablesStore();
const router = useRouter();

const menuItems = ref([
  {
    key: 1,
    label: 'General',
    icon: Cog,
    active: true,
    command: () => {
      router.push({name: 'general'})
    }
  },
  {
    key: 2,
    label: 'Tables',
    icon: Table,
    command: () => {
      router.push({name: 'tables'})
    }
  },
  {
    key: 3,
    label: 'Query',
    icon: Play,
    command: () => {
      router.push({name: 'query'})
    }
  },
  {
    key: 4,
    label: 'IA',
    icon: PenLine,
    disabled: true,
    command: () => {
      router.push({name: 'ia'})
    }
  },
] as any[])

onMounted(() => {
  if(datasourceStore.datasourceChoosen) {
    appStore.setTitle(datasourceStore.datasourceChoosen.name);
  }
})

const datasource = computed(() => datasourceStore.datasourceChoosen);
const showRefreshIndicator = computed(() => {
  return !['query'].includes(router.currentRoute.value.name as string);
})
const isRefreshing = computed(() => settingsStore.isRefreshing);

function logout() {
  datasourceStore.clearDatasource();
  tablesStore.clear();
  router.push("/");
}
</script>

<template>
  <transition name="fade" mode="out-in">
    <div>
      <Menubar :model="menuItems" class="w-full">
        <template #start>
          <div class="flex items-center gap-8 w-full">
            <span class="flex items-center gap-2 title"><Database />{{datasource!.name}}</span>
            <div>
            </div>
          </div>
        </template>

        <template #end>
          <div class="flex gap-2 justify-end">
            <AutoRefreshIndicator v-if="showRefreshIndicator" />
            <Button outlined severity="danger" @click="logout()"><SignOut />Log out</Button>
          </div>
        </template>
      </Menubar>

      <div class="content">
        <div class="background m-h-dvh" />
        <transition name="slide" mode="out-in">
          <router-view />
        </transition>
      </div>
    </div>
  </transition>
</template>

<style scoped>

.content {
  min-height: 100dvh;
  background-color: #f9fafb;
  background-image:  repeating-radial-gradient( circle at 0 0, transparent 0, #f9fafb 9px ), repeating-linear-gradient( rgb(68 76 247 / 0.07), rgb(68 76 247 / 0.08));
}

/* Transition simple pour toutes les routes */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
