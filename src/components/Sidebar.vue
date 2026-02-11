<template>
  <aside class="flex flex-col bg-lab-surface/50 border-r border-lab-border select-none overflow-hidden">
    <!-- Header -->
    <div class="px-6 py-4 flex-shrink-0 flex items-center justify-between border-b border-lab-border/30">
      <h2 class="text-[11px] font-black uppercase tracking-[0.2em] text-lab-text-dim/60">Checkpoints</h2>
      <button 
        @click="store.socket.emit('get-checkpoints')"
        class="text-lab-text-dim hover:text-lab-primary transition-colors transform hover:rotate-180 duration-500"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
    </div>

    <!-- Scrollable List -->
    <div class="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
      <div v-if="store.checkpoints.length === 0" class="p-6 text-center italic text-xs text-lab-text-dim/40 border-2 border-dashed border-lab-border rounded-xl">
        No tags detected
      </div>

      <!-- Main Card Container -->
      <div 
        v-for="session in store.checkpoints" 
        :key="session.tag" 
        @click="toggleExpand(session.tag)"
        class="mb-3 p-4 rounded-xl border border-lab-border bg-lab-surface/40 backdrop-blur-sm hover:bg-lab-active hover:border-lab-primary/30 transition-all duration-300 group shadow-sm overflow-hidden cursor-pointer relative"
      >
        <div class="flex justify-between items-start mb-1 gap-2 relative z-10">
          <h3 class="text-sm font-bold text-lab-accent truncate flex-1 group-hover:text-white transition-colors pointer-events-none">
            {{ session.name }}
          </h3>
          
          <!-- Actions: Clickable area -->
          <div class="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" @click.stop>
            <button 
              @click="store.smartRun(session.tag, session.name)"
              class="px-2 py-1 bg-lab-primary text-white text-[10px] font-bold rounded shadow hover:scale-105 active:scale-95 transition"
            >
              RUN
            </button>
            <button 
              @click="runInNew(session.tag)"
              class="px-2 py-1 bg-lab-border text-gray-300 text-[10px] font-bold rounded hover:bg-lab-active transition"
            >
              NEW
            </button>
            <button 
              @click="handleDelete(session.tag)"
              class="px-2 py-1 text-[10px] font-bold rounded transition-all duration-200"
              :class="confirmingTag === session.tag ? 'bg-red-600 text-white animate-pulse' : 'bg-red-900/30 text-red-400 hover:bg-red-900/50'"
            >
              {{ confirmingTag === session.tag ? 'SURE?' : 'DEL' }}
            </button>
          </div>
        </div>

        <!-- Time and Preview: Passive elements -->
        <div class="text-[10px] text-lab-text-dim/50 font-medium mb-3 pointer-events-none">{{ session.time }}</div>

        <div class="overflow-hidden pointer-events-none">
          <!-- Collapsed View -->
          <div v-if="expandedTag !== session.tag" class="flex items-center gap-2 py-2 px-2 bg-lab-bg/50 rounded-lg">
            <span class="text-[8px] font-black text-lab-primary uppercase tracking-tighter bg-lab-primary/10 px-1 rounded flex-shrink-0">Last</span>
            <p class="text-[11px] text-lab-text-dim truncate">{{ session.preview[session.preview.length-1] || '...' }}</p>
          </div>

          <!-- Expanded View -->
          <div v-else class="space-y-3 mt-4 pt-4 border-t border-lab-border animate-in fade-in slide-in-from-top-2 duration-300">
            <div v-for="(p, i) in session.preview" :key="i" class="flex gap-3 overflow-hidden">
              <span class="text-[10px] font-black text-lab-text-dim/30 w-4 pt-0.5 flex-shrink-0">{{ i + 1 }}</span>
              <p class="text-[11px] text-lab-text-dim leading-relaxed border-l-2 border-lab-border pl-3 break-words overflow-hidden w-full whitespace-normal">{{ p }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref } from 'vue';
import { useAppStore } from '../stores/app';

const store = useAppStore();
const expandedTag = ref(null);
const confirmingTag = ref(null);
let confirmTimer = null;

const toggleExpand = (tag) => {
  expandedTag.value = expandedTag.value === tag ? null : tag;
};

const handleDelete = (tag) => {
  if (confirmingTag.value === tag) {
    store.socket.emit('delete-checkpoint', tag);
    confirmingTag.value = null;
    clearTimeout(confirmTimer);
  } else {
    confirmingTag.value = tag;
    clearTimeout(confirmTimer);
    confirmTimer = setTimeout(() => {
      confirmingTag.value = null;
    }, 3000);
  }
};

const runInNew = (tag) => {
  const currentPath = store.terminalPaths[store.activeTabId] || store.projectPath;
  const url = `/?tag=${encodeURIComponent(tag)}&path=${encodeURIComponent(currentPath)}`;
  window.open(url, '_blank');
};
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #2d333b; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4285f4; }
</style>
