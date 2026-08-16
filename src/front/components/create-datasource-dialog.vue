<script setup lang="ts">
import {Button, Dialog, Divider, InputNumber, InputText, Message, Password} from 'primevue';
import {FormField, FormResolverOptions} from '@primevue/forms';
import {Times} from "@primeicons/vue";
import {ref} from "vue";
import {useDatasourcesStore} from "../stores/datasource-store";
import {CreateDatasourceFormDto} from "../../commons/data/dto/forms/create-datasource-form-dto";

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  }
});

const datasourceStore = useDatasourcesStore();

const emit = defineEmits(['update:modelValue'])

const form = ref({
  name: '',
  hostname: '',
  port: 5432,
  dbname: '',
  username: '',
  password: ''
} as CreateDatasourceFormDto)

function closeDialog() {
  emit('update:modelValue', false);
}

function resolver() {
  return (e: FormResolverOptions) => {
    console.log(e)
    return Promise.resolve()
  }
}

function onFormSubmit() {
  datasourceStore.createDatasource(new CreateDatasourceFormDto(
      form.value.name, form.value.hostname, form.value.port, form.value.dbname, form.value.username, form.value.password
  )).then(() => {
    closeDialog();
  });
}

</script>

<template>
  <Dialog :visible="modelValue" :closable="false" modal header="Create datasource" class="w-6/12">
    <template #header>
      <div class="header flex flex-col justify-center w-full">
        <div class="flex justify-between items-center w-full">
          <span class="text-lg font-light">Create datasource</span>
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
          <Button severity="success" @click="onFormSubmit()">Create</Button>
        </div>
      </div>
    </template>
  </Dialog>
</template>
