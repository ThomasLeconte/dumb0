<script setup lang="ts">
import {Button, Dialog, Divider, InputNumber, InputText, Message, Password, Toast, useToast} from 'primevue';
import {FormField, FormResolverOptions} from '@primevue/forms';
import {Times} from "@primeicons/vue";
import {onMounted, ref} from "vue";
import {useDatasourcesStore} from "../stores/datasource-store";
import {CreateDatasourceFormDto} from "../../commons/data/dto/forms/create-datasource-form-dto";
import {DatasourceDto} from "../../commons/data/dto/datasource-dto";

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
  datasource: {
    type: Object as () => DatasourceDto,
    required: false
  }
});

const datasourceStore = useDatasourcesStore();

const toast = useToast();

const emit = defineEmits(['update:modelValue'])

const form = ref({
  name: '',
  hostname: '',
  port: 5432,
  dbname: '',
  username: '',
  password: ''
} as CreateDatasourceFormDto)

onMounted(() => {
  if(props.datasource) {
    form.value.name = props.datasource.name;
    form.value.hostname = props.datasource.hostname;
    form.value.port = props.datasource.port;
    form.value.dbname = props.datasource.dbname;
    form.value.username = props.datasource.username;
    form.value.password = props.datasource.password;
  }
})

function closeDialog() {
  form.value = {
    name: '',
    hostname: '',
    port: 5432,
    dbname: '',
    username: '',
    password: ''
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
  const _form = new CreateDatasourceFormDto(
      form.value.name, form.value.hostname, form.value.port, form.value.dbname, form.value.username, form.value.password
  );
  Promise.resolve(props.datasource && props.datasource.id
      ? datasourceStore.updateDatasource(props.datasource.id, _form)
      : datasourceStore.createDatasource(_form))
      .then(() => {
    closeDialog();
  }).catch((err) => {
    console.error(err);
    toast.add({ severity: 'error', group: 'bottom-center', summary: 'Datasource not created', detail: 'An error occured when tried to connect on datasource using these informations.', life: 3000 });
  });
}

</script>

<template>
  <Dialog :visible="modelValue" :closable="false" modal class="w-6/12">
    <template #header>
      <div class="header flex flex-col justify-center w-full">
        <div class="flex justify-between items-center w-full">
          <span class="text-lg font-light">{{props.datasource?.id ? 'Update datasource' : 'Create datasource'}}</span>
          <Button iconOnly rounded outlined severity="contrast"><Times size="16" @click="closeDialog()" /></Button>
        </div>
        <Divider />
      </div>
    </template>

    <div class="content my-5">
      <FormField v-slot="$field" as="section" name="name" initialValue="" class="flex flex-col gap-2 my-2">
        <InputText type="text" v-model="form.name" placeholder="Datasource name" />
        <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}</Message>
      </FormField>
      <FormField v-slot="$field" as="section" name="host" initialValue="" class="flex flex-col gap-2 my-2">
        <InputText type="text" v-model="form.hostname" placeholder="Host" />
        <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}</Message>
      </FormField>
      <FormField v-slot="$field" as="section" name="port" initialValue="" class="flex flex-col gap-2 my-2">
        <InputNumber :default-value="5432" v-model="form.port" placeholder="Number" />
        <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}</Message>
      </FormField>
      <FormField v-slot="$field" as="section" name="dbname" initialValue="" class="flex flex-col gap-2 my-2">
        <InputText type="text" v-model="form.dbname" placeholder="Database name" />
        <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}</Message>
      </FormField>
      <FormField v-slot="$field" as="section" name="username" initialValue="" class="flex flex-col gap-2 my-2">
        <InputText type="text" v-model="form.username" placeholder="Username" />
        <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}</Message>
      </FormField>
      <FormField v-slot="$field" asChild name="password" initialValue="">
        <section class="flex flex-col gap-2">
          <Password type="text" v-model="form.password" placeholder="Password" :feedback="false" toggleMask fluid />
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{ $field.error?.message }}</Message>
        </section>
      </FormField>
    </div>

    <template #footer>
      <div class="footer flex flex-col justify-center w-full">
        <Divider />
        <div class="flex justify-end items-center w-full gap-4">
          <Button severity="contrast" outlined @click="closeDialog()">Cancel</Button>
          <Button severity="success" @click="onFormSubmit()">{{props.datasource?.id ? 'Update' : 'Create'}}</Button>
        </div>
      </div>
      <Toast position="bottom-center" group="bottom-center" />
    </template>
  </Dialog>
</template>
