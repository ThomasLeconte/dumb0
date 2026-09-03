<script setup lang="ts">
import {
  Button,
  Dialog,
  Divider,
  Textarea,
  InputText,
  Message,
  Toast,
  useToast,
  Listbox,
  ListboxChangeEvent
} from 'primevue';
import {FormField, FormResolverOptions} from '@primevue/forms';
import {Times} from "@primeicons/vue";
import {onMounted, ref} from "vue";
import {useDatasourcesStore} from "../stores/datasource-store";
import {CreateDatasourceFormDto} from "../../commons/data/dto/forms/create-datasource-form-dto";
import {DatasourceDto} from "../../commons/data/dto/datasource-dto";
import {DatasourceSavedQueryDto} from "../../commons/data/dto/datasource-saved-query-dto";
import {CreateQueryFormDto} from "../../commons/data/dto/forms/create-query-form-dto";
import {useSettingsStore} from "../stores/settings-store";
import {ParametersEnum} from "../../commons/data/dto/parameters-enum";

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
});

const datasourceStore = useDatasourcesStore();
const settingsStore = useSettingsStore();

const toast = useToast();

const emit = defineEmits(['update:modelValue'])

const form = ref({
  apiKey: '',
  language: ''
})
const countries = ref([
  { name: 'Australia', code: 'AU' },
  { name: 'Brazil', code: 'BR' },
  { name: 'China', code: 'CN' },
  { name: 'Egypt', code: 'EG' },
  { name: 'France', code: 'FR' },
  { name: 'Germany', code: 'DE' },
  { name: 'India', code: 'IN' },
  { name: 'Japan', code: 'JP' },
  { name: 'Spain', code: 'ES' },
  { name: 'United States', code: 'US' }
]);

onMounted(() => {
  const apiKeySettingValue = settingsStore.getByCode(ParametersEnum.AI_API_KEY);
  const aiDefaultLanguageSettingValue = settingsStore.getByCode(ParametersEnum.AI_DEFAULT_LANGAGE);
  form.value.apiKey = apiKeySettingValue?.value ?? '';
  form.value.language = aiDefaultLanguageSettingValue?.value ?? '';
})

function closeDialog() {
  emit('update:modelValue', false);
}

function onLanguageChange(evt: ListboxChangeEvent) {
  form.value.language = evt.value.code;
}

function onFormSubmit() {
  console.log(form.value)
  Promise.all([
      settingsStore.update(ParametersEnum.AI_API_KEY, form.value.apiKey),
      settingsStore.update(ParametersEnum.AI_DEFAULT_LANGAGE, form.value.language)
  ]).then((res) => {
    toast.add({severity: 'success', group: 'bottom-center', summary: 'Settings updated!', life: 3000});
    closeDialog();
  }).catch((err) => {
    console.error(err);
    const title = 'Settings not updated';
    const detail = err.message ?? 'An error occured when tried to update settings.'
    toast.add({severity: 'error', group: 'bottom-center', summary: title, detail, life: 3000});
  })
}

</script>

<template>
  <Dialog :visible="modelValue" :closable="false" modal class="w-6/12">
    <template #header>
      <div class="header flex flex-col justify-center w-full">
        <div class="flex justify-between items-center w-full">
          <span class="text-lg font-light">AI settings</span>
          <Button iconOnly rounded outlined severity="contrast" @click="closeDialog()">
            <Times size="16"/>
          </Button>
        </div>
        <Divider/>
      </div>
    </template>

    <div class="content my-5">
      <FormField v-slot="$field" as="section" name="apiKey" initialValue="" class="flex flex-col gap-2 my-2">
        <InputText type="text" v-model="form.apiKey" placeholder="AI API Key" />
        <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{$field.error?.message }}</Message>
      </FormField>
      <Message severity="info" size="small">
        We use Mistral AI API to analyze queries. Please generate API key <a href="https://console.mistral.ai">from here.</a>
      </Message>
      <FormField v-slot="$field" as="section" name="language" initialValue="" class="flex flex-col gap-2 mt-8 my-2">
        <span class="text-xs">Choose AI language response</span>
        <Listbox @change="onLanguageChange" :options="countries" optionLabel="name" class="w-full">
          <template #option="slotProps">
            <div class="flex items-center gap-2">
              <img :alt="slotProps.option.name" src="https://primefaces.org/cdn/primevue/images/flag/flag_placeholder.png" :class="`flag flag-${slotProps.option.code.toLowerCase()}`" style="width: 18px" />
              <div>{{ slotProps.option.name }}</div>
            </div>
          </template>
        </Listbox>
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
          <Button severity="success" @click="onFormSubmit()">Save</Button>
        </div>
      </div>
      <Toast position="bottom-center" group="bottom-center"/>
    </template>
  </Dialog>
</template>
