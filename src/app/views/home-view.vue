<script setup lang="ts">
import {Card, Button} from "primevue";
import {Plus} from '@primeicons/vue'
</script>

<template>
  <div class="home-content w-full h-full min-h-dvh flex flex-col justify-center items-center">
    <div class="home-background"></div>
    <div class="title flex flex-col justify-center items-center">
      <div class="text-5xl title">DB-APP</div>
      <div class="text-xl">Your personal DBA for PostgreSQL 🐘</div>
    </div>

    <Card class="my-20">
      <template #content>
        <span class="text-xl font-light">Datasources</span>
        <div class="databases-list p-10">
          <div class="border-dashed border-2 border-gray-400 rounded-lg p-10">
            <Button outlined severity="contrast"><Plus />Create</Button>
          </div>
        </div>
      </template>
    </Card>


  </div>
</template>

<style scoped>
  .home-background {
    background-color: #E5E5F7;
    opacity: 0.1;
    z-index: -9999;
    position: absolute;
    height: 100dvh;
    width: 100dvh;
    background-image:  repeating-radial-gradient( circle at 0 0, transparent 0, #E5E5F7 10px ), repeating-linear-gradient( #444CF755, #444CF7 );
  }

  .title {
    font-family: 'consolas';
    font-family: 'menlo';
  }
</style>
