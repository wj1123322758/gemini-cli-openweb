<template>
  <div class="flex items-center gap-1" :class="class">
    <button 
      v-for="cmd in commands" 
      :key="cmd.label" 
      @click="$emit('command', cmd.value)"
      class="px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-all whitespace-none"
      :class="getButtonClass(cmd)"
      :title="cmd.title"
    >
      {{ cmd.label }}
    </button>
  </div>
</template>

<script setup>
const props = defineProps({
  commands: { type: Array, required: true },
  class: { type: String, default: '' }
});

defineEmits(['command']);

function getButtonClass(cmd) {
  // Group-based styling
  if (['gemini', '!', '/clear', '/help'].some(c => cmd.value.includes(c) && cmd.value.length < 10)) {
    return 'text-lab-text-dim hover:text-lab-primary hover:bg-lab-primary/10';
  }
  if (['/compress', '/rewind', '/chat'].some(c => cmd.value.includes(c))) {
    return 'text-lab-text-dim hover:text-lab-accent hover:bg-lab-accent/10';
  }
  if (['/model', '/theme', '/auth', '/vim'].some(c => cmd.value.includes(c))) {
    return 'text-lab-text-dim hover:text-yellow-500 hover:bg-yellow-500/10';
  }
  if (['/mcp', '/memory', '\x19'].some(c => cmd.value.includes(c) || cmd.value === c)) {
    return 'text-lab-text-dim hover:text-green-500 hover:bg-green-500/10';
  }
  return 'text-lab-text-dim hover:text-white hover:bg-white/10';
}
</script>
