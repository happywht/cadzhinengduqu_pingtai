<template>
  <div v-if="isShow" class="loading-overlay">
    <div class="spinner"></div>
    <p style="font-weight: 500; color: var(--brand-primary)">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isShow: boolean
  message?: string
}>()
</script>

<style scoped>
.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 16px;
  z-index: 50;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(37, 99, 235, 0.3);
  border-radius: 50%;
  border-top-color: var(--brand-primary);
  animation: spin 1s ease-in-out infinite;
}
</style>
