<script setup>
</script>
<template>
  <transition name="fade" mode="out-in">
    <router-view />
  </transition>
</template>

<style>
.title {
  font-family: 'consolas';
  font-family: 'menlo';
}

/* Transition pour les sous-routes (general, tables, query) */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
