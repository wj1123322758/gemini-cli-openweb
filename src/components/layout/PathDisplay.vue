<template>
  <div 
    @click="handleClick"
    class="flex items-center gap-2 px-3 py-1.5 bg-lab-surface/50 border border-lab-border rounded-full cursor-pointer hover:border-lab-primary transition-all group overflow-hidden max-w-xl"
  >
    <span class="text-[10px] font-bold text-lab-primary uppercase tracking-tighter opacity-70 group-hover:opacity-100">
      Path
    </span>
    <span class="text-xs text-lab-text-dim truncate font-mono">
      {{ projectStore.projectPath }}
    </span>
  </div>
</template>

<script setup>
import { useProjectStore } from '../../stores';

const projectStore = useProjectStore();

const emit = defineEmits(['change']);

function handleClick() {
  const newPath = prompt("Enter project absolute path:", projectStore.projectPath);
  if (newPath) {
    emit('change', newPath.trim());
  }
}
</script>
