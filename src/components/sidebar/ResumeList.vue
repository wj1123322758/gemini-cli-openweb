<template>
  <div class="flex flex-col h-full overflow-hidden">
    <div class="px-6 py-4 flex-shrink-0 flex items-center justify-between border-b border-lab-border/20">
      <h2 class="text-[10px] font-bold uppercase tracking-widest text-lab-text-dim/60">最近自动对话</h2>
      <button @click="store.socket.emit('get-resumes')" class="p-1 hover:text-lab-accent transition-all hover:rotate-90">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
      </button>
    </div>
    <div class="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar space-y-3">
      <div v-if="store.resumes.length === 0" class="p-8 text-center italic text-xs text-lab-text-dim/30 border border-dashed border-lab-border rounded-xl">暂无自动保存记录</div>
      <div v-for="res in store.resumes" :key="res.rawTime" @click="toggleExpand('res-'+res.rawTime)" class="p-4 rounded-xl border border-lab-border bg-lab-surface/40 hover:border-lab-accent/40 transition-all cursor-pointer group shadow-sm">
        <div class="flex justify-between items-start mb-2">
          <div class="flex-1 min-w-0 pr-2">
            <h3 class="text-sm font-bold text-gray-100 truncate">{{ res.name }}</h3>
            <div class="flex items-center gap-2 mt-1">
              <span v-if="!res.tag" class="px-1 py-0.5 bg-yellow-500/20 text-yellow-500 text-[8px] font-black rounded uppercase">当前会话 / (current)</span>
              <span v-else class="px-1 py-0.5 bg-lab-accent/20 text-lab-accent text-[8px] font-black rounded uppercase">标签: {{ res.tag }}</span>
              <span class="text-[9px] text-lab-text-dim/40 font-mono">{{ res.msgCount }} 消息</span>
            </div>
          </div>
          <div class="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all" @click.stop>
            <button @click="runInNew(res.tag)" class="p-1.5 bg-lab-accent text-white rounded-lg hover:scale-110 shadow-lg shadow-lab-accent/20" title="新窗口恢复"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg></button>
            <button @click="store.smartRun(res.tag, res.name)" class="p-1.5 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600" title="当前终端恢复"><svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M4.5 3.5v13l11-6.5-11-6.5z"/></svg></button>
          </div>
        </div>
        <div class="text-[10px] text-lab-text-dim/50 font-mono">{{ res.time }}</div>
        <div v-if="expandedTag === 'res-'+res.rawTime" class="space-y-2 mt-3 pt-3 border-t border-lab-border/30 animate-in">
          <p v-for="(p, i) in res.preview" :key="i" class="text-[11px] text-lab-text-dim/70 border-l-2 border-lab-border/50 pl-3 italic truncate"># {{ p }}</p>
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

const toggleExpand = (tag) => { expandedTag.value = expandedTag.value === tag ? null : tag; };

const runInNew = (tag) => {
  // 如果是自动记录，tag 可能为空，但这不影响 URL 参数传递，后端会处理空 tag 为 checkpoint-.json
  const currentPath = store.terminalPaths[store.activeTabId] || store.projectPath;
  const url = `/?tag=${encodeURIComponent(tag || '')}&path=${encodeURIComponent(currentPath)}`;
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
