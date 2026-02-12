<template>
  <div class="flex flex-col h-full overflow-hidden">
    <div class="px-6 py-4 flex-shrink-0 flex items-center justify-between border-b border-lab-border/20">
      <h2 class="text-[10px] font-bold uppercase tracking-widest text-lab-text-dim/60">手动存档</h2>
      <button @click="store.socket.emit('get-checkpoints')" class="p-1 hover:text-lab-primary transition-all hover:rotate-90">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
      </button>
    </div>
    <div class="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar space-y-3">
      <div v-if="store.checkpoints.length === 0" class="p-8 text-center italic text-xs text-lab-text-dim/30 border border-dashed border-lab-border rounded-xl">未检测到手动存档</div>
      <div v-for="session in store.checkpoints" :key="session.tag" @click="toggleExpand(session.tag)" class="p-4 rounded-xl border border-lab-border bg-lab-surface/40 hover:border-lab-primary/40 transition-all cursor-pointer group shadow-sm">
        <div class="flex justify-between items-start mb-2">
          <h3 class="text-sm font-bold text-gray-100 truncate flex-1 pr-2">{{ session.name }}</h3>
          <div class="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all" @click.stop>
            <button @click="runInNew(session.tag)" class="p-1.5 bg-lab-primary text-white rounded-lg hover:scale-110 shadow-lg shadow-lab-primary/20" title="新窗口运行"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg></button>
            <button @click="store.smartRun(session.tag, session.name)" class="p-1.5 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600" title="当前终端运行"><svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M4.5 3.5v13l11-6.5-11-6.5z"/></svg></button>
            <button @click="handleDelete(session.tag)" class="p-1.5 bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/50" title="删除"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
          </div>
        </div>
        <div class="text-[10px] text-lab-text-dim/50 font-mono mb-2">{{ session.time }}</div>
        <div v-if="expandedTag === session.tag" class="space-y-2 mt-3 pt-3 border-t border-lab-border/30 animate-in">
          <p v-for="(p, i) in session.preview" :key="i" class="text-[11px] text-lab-text-dim/70 border-l-2 border-lab-border/50 pl-3 italic truncate"># {{ p }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAppStore } from '../../stores/app';

const store = useAppStore();
const expandedTag = ref(null);
const confirmingTag = ref(null);
let confirmTimer = null;

const toggleExpand = (tag) => { expandedTag.value = expandedTag.value === tag ? null : tag; };

const handleDelete = (tag) => {
  if (confirmingTag.value === tag) {
    store.socket.emit('delete-checkpoint', tag);
    confirmingTag.value = null;
    clearTimeout(confirmTimer);
  } else {
    confirmingTag.value = tag;
    clearTimeout(confirmTimer);
    confirmTimer = setTimeout(() => { confirmingTag.value = null; }, 3000);
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
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--lab-accent); }
.animate-in { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
</style>
