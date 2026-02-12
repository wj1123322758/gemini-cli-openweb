<template>
  <header class="h-14 flex items-center justify-between px-6 bg-transparent/80 backdrop-blur-md border-b border-lab-border z-10">
    <div class="flex items-center gap-6 overflow-hidden">
      <h1 class="text-sm font-bold tracking-wider text-lab-accent whitespace-nowrap">
        GEMINI <span class="font-light text-gray-500">| STATION</span>
      </h1>
      
      <PathDisplay @change="handlePathChange" />
    </div>
    
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-green-500">
        <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
        系统就绪
      </div>
    </div>
  </header>
</template>

<script setup>
import { useProjectStore } from '../../stores';
import PathDisplay from './PathDisplay.vue';

const projectStore = useProjectStore();

function handlePathChange(newPath) {
  projectStore.setProjectPath(newPath);
}
</script>
