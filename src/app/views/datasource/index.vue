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
    label: 'General',
    icon: Cog,
    active: true,
    command: () => {
      router.push({name: 'general'})
    }
  },
  {
    label: 'Tables',
    icon: Table,
    command: () => {
      router.push({name: 'tables'})
    }
  },
  {
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
  datasourceStore.selectDatasource(null);
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

  <router-view />
</template>

<style scoped>
.title {
  font-family: 'consolas';
  font-family: 'menlo';
}
</style>