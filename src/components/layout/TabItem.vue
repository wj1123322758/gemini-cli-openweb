<template>
  <div 
    @click="$emit('activate')"
    class="group relative h-8 px-4 flex items-center gap-3 cursor-pointer rounded-t-lg transition-all duration-200"
    :class="isActive ? 'bg-lab-surface text-white' : 'text-lab-text-dim hover:bg-lab-surface/50'"
  >
    <span class="text-xs font-medium truncate max-w-[120px]">{{ tab.title }}</span>
    <span 
      @click.stop="$emit('close')" 
      class="opacity-0 group-hover:opacity-100 text-xs text-gray-500 hover:text-red-400 p-0.5 rounded"
    >
      ×
    </span>
    <div 
      v-if="isActive" 
      class="absolute bottom-0 left-2 right-2 h-0.5 bg-lab-primary rounded-full"
    />
  </div>
</template>

<script setup>
defineProps({
  tab: { type: Object, required: true },
  isActive: { type: Boolean, default: false }
});

defineEmits(['activate', 'close']);
</script>
