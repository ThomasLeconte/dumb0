<script setup lang="ts">
import Sidebar from 'primevue/sidebar';
import SidebarAside from 'primevue/sidebaraside';
import SidebarContent from 'primevue/sidebarcontent';
import SidebarMenuItem from 'primevue/sidebarmenuitem';
import SidebarFooter from 'primevue/sidebarfooter';
import SidebarHeader from 'primevue/sidebarheader';
import SidebarMain from 'primevue/sidebarmain';
import SidebarLayout from 'primevue/sidebarlayout';
import SidebarPanel from 'primevue/sidebarpanel';
import SidebarSpacer from 'primevue/sidebarspacer';
import SidebarTrigger from 'primevue/sidebartrigger';
import {useTablesStore} from "../stores/tables-store";

const tablesStore = useTablesStore();
</script>

<template>
  <SidebarLayout>
    <Sidebar>
      <SidebarSpacer />
      <SidebarAside>
        <SidebarPanel>
          <SidebarHeader>Tables</SidebarHeader>
          <SidebarContent>
            <SidebarMenuItem v-for="(item, index) in tablesStore.tables" :key="index" class="m-5">
              {{item}}
            </SidebarMenuItem>
          </SidebarContent>
          <SidebarFooter>...</SidebarFooter>
        </SidebarPanel>
      </SidebarAside>
    </Sidebar>
    <SidebarMain>
      <SidebarTrigger></SidebarTrigger>
    </SidebarMain>
  </SidebarLayout>
</template>