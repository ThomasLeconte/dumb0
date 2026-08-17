<script setup lang="ts">
import {Database, Plus, Print, Search, SignOut, PenLine, Cog, Table} from '@primeicons/vue';
import {Toolbar, Button, IconField, InputIcon, Menubar, Toast} from "primevue";
import {useDatasourcesStore} from "../../stores/datasource-store";
import {computed, ref} from "vue";
import {useTablesStore} from "../../stores/tables-store";
import {useRouter} from "vue-router";

const datasourceStore = useDatasourcesStore();
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
    label: 'IA',
    icon: PenLine,
    disabled: true,
    command: () => {
      router.push({name: 'ia'})
    }
  }
] as any[])

const datasource = computed(() => datasourceStore.datasourceChoosen);

function logout() {
  datasourceStore.clearDatasource();
  tablesStore.clear();
  router.push("/");
}
</script>

<template>
  <Menubar :model="menuItems" class="w-full">
    <template #start>
      <div class="flex items-center gap-8 w-full">
        <span class="flex items-center gap-2 title"><Database />{{datasource!.name}}</span>
        <div>
        </div>
      </div>
    </template>

    <template #end>
      <Button outlined severity="danger" @click="logout()"><SignOut />Log out</Button>
    </template>
  </Menubar>

  <div class="content">
    <div class="background m-h-dvh" />
    <router-view />
  </div>
</template>

<style scoped>
.title {
  font-family: 'consolas';
  font-family: 'menlo';
}

.content {
  min-height: 100dvh;
  background-color: #f9fafb;
  background-image:  repeating-radial-gradient( circle at 0 0, transparent 0, #f9fafb 9px ), repeating-linear-gradient( rgb(68 76 247 / 0.07), rgb(68 76 247 / 0.08));
}
</style>
