<script setup lang="ts">
import {Button, Dialog, Divider, Textarea, InputText, Message, Toast, useToast} from 'primevue';
import {FormField, FormResolverOptions} from '@primevue/forms';
import {Times} from "@primeicons/vue";
import {onMounted, ref} from "vue";
import {useDatasourcesStore} from "../stores/datasource-store";
import {CreateDatasourceFormDto} from "../../commons/data/dto/forms/create-datasource-form-dto";
import {DatasourceDto} from "../../commons/data/dto/datasource-dto";
import {DatasourceSavedQueryDto} from "../../commons/data/dto/datasource-saved-query-dto";
import {CreateQueryFormDto} from "../../commons/data/dto/forms/create-query-form-dto";

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  initialQuery: {
    type: String,
    required: true
  },
  savedQuery: {
    type: Object as () => DatasourceSavedQueryDto,
    required: false
  }
});

const datasourceStore = useDatasourcesStore();

const toast = useToast();

const emit = defineEmits(['update:modelValue'])

const form = ref({
  name: '',
  query: ''
})

onMounted(() => {
  form.value.query = props.initialQuery;
  if (props.savedQuery) {
    form.value.name = props.savedQuery.name;
    form.value.query = props.savedQuery.query;
  }
})

function closeDialog() {
  form.value = {
    name: '',
    query: ''
  }
  emit('update:modelValue', false);
}

function resolver() {
  return (e: FormResolverOptions) => {
    console.log(e)
    return Promise.resolve()
  }
}

function onFormSubmit() {
  if(!datasourceStore.datasourceChoosen) return;
  const _form = new CreateQueryFormDto(
      form.value.name, form.value.query, datasourceStore.datasourceChoosen.id);
  Promise.resolve(props.savedQuery && props.savedQuery.id
      ? datasourceStore.updateSavedQuery(props.savedQuery.id, _form)
      : datasourceStore.createSavedQuery(_form))
      .then(() => {
        closeDialog();
      }).catch((err) => {
    console.error(err);
    const title = props.savedQuery?.id ? 'Query not updated' : 'Query not created';
    const detail = props.savedQuery?.id
        ? err.message ?? 'An error occured when tried to update query'
        : err.message ?? 'An error occured when tried to create query'
    toast.add({severity: 'error', group: 'bottom-center', summary: title, detail, life: 3000});
  });
}

</script>

<template>
  <Dialog :visible="modelValue" :closable="false" modal class="w-6/12">
    <template #header>
      <div class="header flex flex-col justify-center w-full">
        <div class="flex justify-between items-center w-full">
          <span class="text-lg font-light">{{ props.savedQuery?.id ? 'Update query' : 'Create query' }}</span>
          <Button iconOnly rounded outlined severity="contrast">
            <Times size="16" @click="closeDialog()"/>
          </Button>
        </div>
        <Divider/>
      </div>
    </template>

    <div class="content my-5">
      <FormField v-slot="$field" as="section" name="name" initialValue="" class="flex flex-col gap-2 my-2">
        <InputText type="text" v-model="form.name" placeholder="Query name"/>
        <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{
            $field.error?.message
          }}
        </Message>
      </FormField>
      <FormField v-slot="$field" as="section" name="host" initialValue="" class="flex flex-col gap-2 my-2">
        <Textarea v-model="form.query" placeholder="SELECT * FROM your_table LIMIT 10;" :rows="8" autoResize/>
        <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{
            $field.error?.message
          }}
        </Message>
      </FormField>
    </div>

    <template #footer>
      <div class="footer flex flex-col justify-center w-full">
        <Divider/>
        <div class="flex justify-end items-center w-full gap-4">
          <Button severity="contrast" outlined @click="closeDialog()">Cancel</Button>
          <Button severity="success" @click="onFormSubmit()">{{ props.savedQuery?.id ? 'Update' : 'Create' }}</Button>
        </div>
      </div>
      <Toast position="bottom-center" group="bottom-center"/>
    </template>
  </Dialog>
</template>
