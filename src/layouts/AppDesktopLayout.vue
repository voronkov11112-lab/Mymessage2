<script setup lang="ts">
defineProps<{
  mode: 'auth' | 'app';
}>();
</script>

<template>
  <div class="app-desktop-layout">
    <slot />
  </div>
</template>

<style scoped>
.app-desktop-layout {
  width: 100%;
  min-height: 100vh;
}
</style>
