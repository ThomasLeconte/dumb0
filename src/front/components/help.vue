<script setup lang="ts">
import {Button, Dialog, Divider} from 'primevue';
import {Info, Times} from "@primeicons/vue";
import {ref} from "vue";

const props = defineProps({
  key: {
    type: String,
    required: true
  }
});

const show = ref(false);

const emit = defineEmits(['update:modelValue'])

function closeDialog() {
  show.value = false;
}

function showDialog() {
  show.value = true;
}

</script>

<template>
  <Button class="mx-2" iconOnly rounded outlined severity="info" size="small"><Info @click="showDialog" /></Button>

  <Dialog v-if="show" :visible="show" :closable="false" modal class="w-6/12">
    <template #header>
      <div class="header flex flex-col justify-center w-full">
        <div class="flex justify-between items-center w-full">
          <span class="text-lg font-light">What does that mean ?</span>
          <Button iconOnly rounded outlined severity="contrast"><Times size="16" @click="closeDialog()" /></Button>
        </div>
        <Divider />
      </div>
    </template>

    <div class="content my-5">

    </div>

    <template #footer>
      <div class="footer flex flex-col justify-center w-full">
        <Divider />
        <div class="flex justify-end items-center w-full gap-4">
          <Button severity="success" @click="closeDialog()">Understood!</Button>
        </div>
      </div>
    </template>
  </Dialog>
</template>