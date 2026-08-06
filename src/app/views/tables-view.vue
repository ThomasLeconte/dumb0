<script setup lang="ts">
import Sidebar from 'primevue/sidebar';
import SidebarAside from 'primevue/sidebaraside';
import SidebarContent from 'primevue/sidebarcontent';
import SidebarMenuItem from 'primevue/sidebarmenuitem';
import SidebarHeader from 'primevue/sidebarheader';
import SidebarMain from 'primevue/sidebarmain';
import SidebarGroup from 'primevue/sidebargroup';
import SidebarGroupLabel from 'primevue/sidebargrouplabel';
import SidebarGroupContent from 'primevue/sidebargroupcontent';
import SidebarMenu from 'primevue/sidebargroupcontent';
import SidebarMenuButton from 'primevue/sidebarmenubutton';
import SidebarLayout from 'primevue/sidebarlayout';
import SidebarPanel from 'primevue/sidebarpanel';
import SidebarSpacer from 'primevue/sidebarspacer';
import Divider from 'primevue/divider';
import Button from 'primevue/button';
import {Database, SignOut} from '@primeicons/vue'
import {useTablesStore} from "../stores/tables-store";
import {computed, onMounted, ref} from "vue";
import TableDetails from "../components/table-details.vue";
import {useDatasourcesStore} from "../stores/datasource-store";

const tablesStore = useTablesStore();
const datasourceStore = useDatasourcesStore();
const active = ref("");

onMounted(() => {
  active.value = tablesStore.tables[0];
})

const datasource = computed(() => {
  return datasourceStore.datasourceChoosen;
})

function onTableClick(tableName: string) {
  active.value = tableName;
  tablesStore.getTableStats(datasourceStore.datasourceChoosen.id, tableName);
}
</script>

<template>
  <SidebarLayout class="dba-sidebar-layout">
    <Sidebar variant="floating" class="dba-sidebar">
      <SidebarSpacer />
      <SidebarAside>
        <SidebarPanel>
          <SidebarHeader>
            <div class="flex justify-between items-center p-2">
              <span class="flex items-center gap-2 title"><Database />{{datasource.name}}</span>
              <Button outlined severity="danger"><SignOut />Log out</Button>
            </div>
            <Divider class="m-0!" />
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Tables ({{tablesStore.tables.length}})</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem v-for="(item, index) in tablesStore.tables" :key="index">
                    <SidebarMenuButton :isActive="active === item" @click="onTableClick(item)">
                      <span>{{item}}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </SidebarPanel>
      </SidebarAside>
    </Sidebar>
    <SidebarMain class="dba-sidebar-aside-content mt-2 mr-2">
      <TableDetails v-if="tablesStore.tableStats != null" :table-name="active" />
    </SidebarMain>
  </SidebarLayout>
</template>

<style scoped>
.dba-sidebar-layout {
  min-height: 0 !important;
}
.dba-sidebar {
  height: 100dvh;
}
</style>