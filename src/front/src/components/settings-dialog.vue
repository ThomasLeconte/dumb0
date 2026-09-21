<script setup lang="ts">
import {Button, Dialog, Divider, InputText, InputNumber, Listbox, Message, Toast, ToggleSwitch, useToast} from 'primevue';
import {FormField} from '@primevue/forms';
import {Times} from "@primeicons/vue";
import {computed, onMounted, ref} from "vue";
import {useSettingsStore} from "@/stores/settings-store.ts";
import {ParametersEnum} from "../../../commons/data/dto/parameters-enum.ts";

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  },
});

const settingsStore = useSettingsStore();

const toast = useToast();

const emit = defineEmits(['update:modelValue'])

const form = ref({
  apiKey: '',
  language: {} as {name: string, code: string} | undefined,
  autoRefresh: false,
  autoRefreshInterval: 5000
})

onMounted(() => {
  settingsStore.fetchAll().then(() => {
    const apiKeySettingValue = settingsStore.getByCode(ParametersEnum.AI_API_KEY);
    const aiDefaultLanguageSettingValue = settingsStore.getByCode(ParametersEnum.AI_DEFAULT_LANGAGE);
    const autoRefreshSettingValue = settingsStore.getByCode(ParametersEnum.AUTO_REFRESH);
    const autoRefreshIntervalSettingValue = settingsStore.getByCode(ParametersEnum.AUTO_REFRESH_INTERVAL);

    form.value.apiKey = apiKeySettingValue?.value ?? '';
    if(aiDefaultLanguageSettingValue?.value) {
      form.value.language = countries.value.find(country =>
          country.code === aiDefaultLanguageSettingValue.value)
    }
    form.value.autoRefresh = autoRefreshSettingValue?.value === 'true' || false;
    form.value.autoRefreshInterval = autoRefreshIntervalSettingValue?.value
        ? Number.parseInt(autoRefreshIntervalSettingValue.value)
        : 5000;
  })
})

const countries = computed(() => settingsStore.availableCountries)

function closeDialog() {
  emit('update:modelValue', false);

}

function onFormSubmit() {
  // Validate auto refresh interval
  if (form.value.autoRefresh && form.value.autoRefreshInterval < 100) {
    toast.add({severity: 'error', group: 'bottom-center', summary: 'Invalid interval', detail: 'Auto refresh interval must be at least 100ms', life: 3000});
    return;
  }

  Promise.all([
    settingsStore.update(ParametersEnum.AI_API_KEY, form.value.apiKey),
    form.value.language ? settingsStore.update(ParametersEnum.AI_DEFAULT_LANGAGE, form.value.language.code) : Promise.resolve(),
    settingsStore.update(ParametersEnum.AUTO_REFRESH, form.value.autoRefresh.toString()),
    settingsStore.update(ParametersEnum.AUTO_REFRESH_INTERVAL, form.value.autoRefreshInterval.toString())
  ]).then((res) => {
    toast.add({severity: 'success', group: 'bottom-center', summary: 'Settings updated!', life: 3000});
    setTimeout(() => {
      closeDialog();
    }, 1500)
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
          <span class="text-lg font-light">Settings</span>
          <Button iconOnly rounded outlined severity="contrast" @click="closeDialog()">
            <Times size="16"/>
          </Button>
        </div>
        <Divider/>
      </div>
    </template>

    <div class="content">
      <!-- AI Settings Section -->
      <div class="mb-6">
        <h3 class="text-lg font-medium mb-4">AI Settings</h3>
        <FormField v-slot="$field" as="section" name="apiKey" initialValue="" class="flex flex-col gap-2 my-2">
          <span class="text-xs">AI API key</span>
          <InputText type="text" v-model="form.apiKey" placeholder="AI API Key" />
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{$field.error?.message }}</Message>
        </FormField>
        <Message severity="info" size="small">
          We use Mistral AI API to analyze queries. Please generate API key <a class="underline" target="_blank" href="https://console.mistral.ai">from here.</a>
        </Message>
        <FormField v-slot="$field" as="section" name="language" initialValue="" class="flex flex-col gap-2 mt-4 my-2">
          <span class="text-xs">Choose AI language response</span>
          <Listbox v-model="form.language" :options="countries" optionLabel="name" class="w-full">
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

      <Divider />

      <!-- Auto-Refresh Settings Section -->
      <div class="mt-6">
        <h3 class="text-lg font-medium mb-4">Auto-Refresh</h3>
        <FormField v-slot="$field" as="section" name="autoRefresh" initialValue="" class="flex flex-col gap-2 my-2">
          <div class="flex items-center gap-2">
            <ToggleSwitch v-model="form.autoRefresh" inputId="autoRefresh" />
            <label for="autoRefresh" class="text-xs">Enable auto-refresh</label>
          </div>
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{$field.error?.message }}</Message>
        </FormField>
        
        <FormField v-slot="$field" as="section" name="autoRefreshInterval" initialValue="" class="flex flex-col gap-2 my-2">
          <span class="text-xs">Refresh interval (ms)</span>
          <InputNumber v-model="form.autoRefreshInterval" :min="100" placeholder="5000" />
          <Message v-if="$field?.invalid" severity="error" size="small" variant="simple">{{$field.error?.message }}</Message>
        </FormField>
        <Message severity="info" size="small">
          Auto-refresh will reload data at the specified interval when enabled.
        </Message>
      </div>
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
