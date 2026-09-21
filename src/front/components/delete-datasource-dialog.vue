<template>
  <div class="flex justify-center">
    <Dialog v-model:visible="visible" modal :closable="false" header="Delete datasource" :style="{ width: '26rem' }">
      <div class="flex flex-col gap-4">
        <p class="text-surface-500 dark:text-surface-400 text-sm mt-0 mb-0">Do you really want to delete <code>"{{datasource.name}}"</code> datasource ? This action cannot be undone!</p>
        <div class="flex justify-end gap-2">
          <Button severity="secondary" @click="visible = false">Cancel</Button>
          <Button severity="danger" @click="deleteDatasource">Delete</Button>
        </div>
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import {Dialog, Button} from 'primevue'
import {DatasourceDto} from "../../commons/data/dto/datasource-dto";
import {useDatasourcesStore} from "../stores/datasource-store";
import {useRouter} from "vue-router";

const props = defineProps({
  datasource: {
    type: Object as () => DatasourceDto,
    required: true
  }
});

const datasourceStore = useDatasourcesStore();
const router = useRouter();

const visible = ref(true);

function deleteDatasource() {
  visible.value = false
  datasourceStore.deleteDatasource(props.datasource)
      .then(() => {
        router.push({name: 'home'});
      })
}
</script>
