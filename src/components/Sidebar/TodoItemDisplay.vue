<template>
  <div class="cursor-text" @click="$emit('click')">
    <p class="text-xs leading-relaxed text-gray-100 break-words whitespace-pre-wrap mb-3">
      {{ todo.text }}
    </p>
    <div 
      v-if="todo.imageUrl" 
      class="relative rounded-xl overflow-hidden border border-lab-border/30 hover:border-lab-accent/50 transition-all shadow-sm"
      @click.stop="openImage"
    >
      <img :src="todo.imageUrl" class="max-h-40 w-full object-cover bg-black/40" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  todo: { type: Object, required: true }
});

defineEmits(['click']);

function openImage(url) {
  window.open(url, '_blank');
}
</script>
