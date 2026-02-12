<template>
  <div class="flex p-1.5 bg-black/20 border-b border-lab-border">
    <button 
      @click="$emit('update:modelValue', 'checkpoints')"
      class="flex-1 py-2 text-[11px] font-bold tracking-widest transition-all rounded-md"
      :class="modelValue === 'checkpoints' 
        ? 'bg-lab-surface text-lab-primary shadow-sm border border-lab-primary/20' 
        : 'text-lab-text-dim/40 hover:text-lab-text-dim'"
    >
      会话存档
    </button>
    <button 
      @click="$emit('update:modelValue', 'todos')"
      class="flex-1 py-2 text-[11px] font-bold tracking-widest transition-all rounded-md relative"
      :class="modelValue === 'todos' 
        ? 'bg-lab-surface text-lab-accent shadow-sm border border-lab-accent/20' 
        : 'text-lab-text-dim/40 hover:text-lab-text-dim'"
    >
      任务清单
      <span 
        v-if="pendingCount > 0" 
        class="absolute top-1 right-2 w-1.5 h-1.5 bg-lab-accent rounded-full animate-pulse shadow-[0_0_5px_#ff6ac1]"
      />
    </button>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: String, required: true },
  pendingCount: { type: Number, default: 0 }
});

defineEmits(['update:modelValue']);
</script>
