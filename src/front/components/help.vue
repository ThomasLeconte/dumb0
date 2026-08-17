<script setup lang="ts">
import {Button, Dialog, Divider} from 'primevue';
import {Info, Times} from "@primeicons/vue";
import {onMounted, ref} from "vue";

const props = defineProps({
  model: {
    type: String,
    required: true
  }
});

const show = ref(false);

onMounted(() => console.log(props.model))

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

    <div class="content my-2">
      <template v-if="'SEQ_SCAN' === model">
        <strong>Sequential scan</strong> is when PostgreSQL reads every row in a table one by one, like flipping through every page of a book to find a word, instead of using an index to jump directly to the right page.
      </template>
      <template v-else-if="'ANALYZE' === model">
        <strong>ANALYZE</strong> is a PostgreSQL command that updates statistics about table data distribution and size, helping the query planner make smarter decisions for optimizing queries.
        More informations <a href="https://www.crunchydata.com/blog/get-started-with-explain-analyze">here.</a>
      </template>
      <template v-else-if="'VACUUM' === model">
        <strong>VACUUM</strong> in PostgreSQL is a maintenance operation that reclaims storage occupied by dead tuples and makes it available for reuse, while also updating visibility information to improve query performance.
      </template>
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