<script setup lang="ts">
import Sidebar from 'primevue/sidebar';
import SidebarAside from 'primevue/sidebaraside';
import SidebarContent from 'primevue/sidebarcontent';
import SidebarMenuItem from 'primevue/sidebarmenuitem';
import SidebarFooter from 'primevue/sidebarfooter';
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
import SidebarTrigger from 'primevue/sidebartrigger';
import {useTablesStore} from "../stores/tables-store";
import {onMounted, ref} from "vue";

const tablesStore = useTablesStore();
const active = ref("");

onMounted(() => {
  active.value = tablesStore.tables[0];
})

function onTableClick(tableName: string) {
  active.value = tableName;
  tablesStore.getTableStats(tableName).then(() => console.log(tablesStore.tableStats));
}
</script>

<template>
  <SidebarLayout>
    <Sidebar>
      <SidebarSpacer />
      <SidebarAside>
        <SidebarPanel>
          <SidebarHeader></SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Tables</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem v-for="(item, index) in tablesStore.tables" :key="index" class="m-5">
                    <SidebarMenuButton :isActive="active === item" @click="onTableClick(item)">
                      <span>{{item}}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>...</SidebarFooter>
        </SidebarPanel>
      </SidebarAside>
    </Sidebar>
    <SidebarMain>
      <h1>Coucou</h1>
      <SidebarTrigger></SidebarTrigger>
    </SidebarMain>
  </SidebarLayout>
</template>
