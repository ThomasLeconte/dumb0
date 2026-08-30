<template>
  <transition name="slide" mode="out-in">
    <router-view />
  </transition>
</template>

<style>
.title {
  font-family: 'consolas';
  font-family: 'menlo';
}

/* Transition simple pour toutes les routes */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(20px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}
</style>
