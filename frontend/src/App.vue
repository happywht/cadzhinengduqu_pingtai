<template>
  <div id="app">
    <AppHeader />
    <div class="workspace">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import AppHeader from './components/AppHeader.vue'
</script>

<style scoped>
.workspace {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
}
</style>
