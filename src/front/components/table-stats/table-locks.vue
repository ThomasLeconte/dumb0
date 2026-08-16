<script setup lang="ts">
import {TableLocksDto} from "../../../commons/data/dto/table-locks-dto";
import {ExclamationCircle} from "@primeicons/vue";
import {Card, Chip, Column, DataTable, Divider} from "primevue";

const props = defineProps({
  locks: {
    type: Array<TableLocksDto>,
    required: true
  }
})
</script>

<template>
  <Card class="w-full my-2">
    <template #title>
      <div class="flex justify-between items-start">
        <span class="section-title">Locks ({{locks.length}})</span>
        <Chip class="bg-orange-100! dark:bg-orange-950! text-orange-700! dark:text-orange-300!">
          <template #icon><ExclamationCircle /></template>
        </Chip>
      </div>
    </template>
    <template #content>
      <Divider />
      <div class="flex">
        <div class="flex justify-evenly w-full mt-4">
          <DataTable :value="locks" stripedRows class="w-full">
            <Column field="name" header="Name">
              <template #body="{ data }">
                <span class="font-medium">{{ data.name }}</span>
              </template>
            </Column>
            <Column field="type" header="Type" />
            <Column field="username" header="Username" />
            <Column field="applicationName" header="Application" />
            <Column field="queryStart" header="Query start" />
          </DataTable>
        </div>
      </div>
    </template>
  </Card>
</template>