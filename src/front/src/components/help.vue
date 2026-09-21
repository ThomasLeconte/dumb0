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
  <slot name="activator" :showHelp="showDialog">
    <Button @click="showDialog" class="mx-2" iconOnly rounded outlined severity="info" size="small"><Info /></Button>
  </slot>

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
      <template v-else-if="'BLOAT' === model">
        <strong>BLOAT</strong> in PostgreSQL is the wasted space and inefficiency caused by dead rows (from updates/deletes) and fragmentation that make tables and indexes larger than necessary. This slows down queries and increases storage usage until cleaned up by operations like <code>VACUUM</code>.
      </template>
      <template v-else-if="'INDEX-STATS' === model">
        <p>
          <code>Disk read</code>: Number of disk blocks read from disk (high values may indicate cache issues). Values can be increased when
        </p>
        <p class="my-2">
          <code>Cache read</code>: Number of index blocks read from memory cache (higher is better for performance).
        </p>
        <p class="italic text-xs">Note: If disk or cache read are > 0, but index scan is not scanned, the index is still being used (e.g., for bitmap heap scans, sorting, or joins), just not for direct scans.</p>
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