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
      <div v-for="res in store.resumes" :key="res.rawTime" 
        @click="toggleExpand('res-'+res.rawTime)" 
        :class="['p-4 rounded-xl border transition-all cursor-pointer group shadow-sm', 
          restoringTag === 'res-'+res.rawTime 
            ? 'border-blue-500 bg-blue-500/10' 
            : 'border-lab-border bg-lab-surface/40 hover:border-lab-accent/40']">
        <!-- 索引号（如 #1, #2...）-->
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xs font-mono text-lab-accent/70">#{{ res.index }}</span>
        </div>
        <div class="flex justify-between items-start">
          <div class="flex-1 min-w-0 pr-2">
            <h3 class="text-sm font-bold text-gray-100 truncate">{{ res.name }}</h3>
            <div class="flex items-center gap-2 mt-1.5">
              <!-- 当前进行中标签 - 绿色呼吸灯效果 -->
              <span v-if="res.isCurrent" class="inline-flex items-center gap-1.5 px-1.5 py-0.5 bg-green-500/15 text-green-400 text-[8px] font-black rounded">
                <span class="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_6px_#4ade80]"></span>
                current
              </span>
              <!-- 消息计数 -->
              <span class="text-[9px] text-lab-text-dim/50 font-mono">{{ res.msgCount }} msgs</span>
              <!-- Age -->
              <span class="text-[9px] text-lab-text-dim/40 font-mono">{{ res.age }}</span>
            </div>
            <!-- 项目路径 -->
            <div v-if="res.projectPath" class="text-[9px] text-lab-text-dim/40 truncate mt-1" :title="res.projectPath">
              <span class="text-lab-accent/60">📁</span> {{ res.projectPath.split('\\').pop() }}
            </div>
          </div>
          <div class="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all" @click.stop>
            <!-- 新窗口打开 -->
            <button @click="runInNew(res)" class="p-1.5 bg-blue-600 text-white rounded-lg hover:scale-110 shadow-lg shadow-blue-600/20" title="新窗口恢复">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
            </button>
            <!-- 当前终端接续 -->
            <button @click="handleResume(res)" 
              :disabled="restoringTag === 'res-'+res.rawTime"
              class="p-1.5 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1" 
              :title="restoringTag === 'res-'+res.rawTime ? '恢复中...' : `恢复 #${res.index}`">
              <svg v-if="restoringTag !== 'res-'+res.rawTime" class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4.5 3.5v13l11-6.5-11-6.5z"/>
              </svg>
              <span v-else class="text-[8px]">...</span>
              <span class="text-[9px] font-mono">#{{ res.index }}</span>
            </button>
          </div>
        </div>
        <!-- 最后更新时间 -->
        <div class="text-[10px] text-lab-text-dim/40 font-mono">{{ res.time }}</div>
        <!-- 展开预览：最近 3 条用户对话 -->
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
const restoringTag = ref(null);

const toggleExpand = (tag) => { 
  expandedTag.value = expandedTag.value === tag ? null : tag; 
};

const runInNew = (res) => {
  // 自动 session 恢复：传递 projectPath 和索引号
  const params = new URLSearchParams({
    resume: 'true',
    path: res.projectPath || '',
    index: res.index.toString()
  });
  window.open(`/?${params.toString()}`, '_blank');
};

const handleResume = async (res) => {
  restoringTag.value = 'res-' + res.rawTime;
  // 使用索引号恢复：gemini --resume <index>
  await store.resumeSession(res.projectPath, res.name, res.index);
  // 3秒后清除恢复状态
  setTimeout(() => {
    restoringTag.value = null;
  }, 3000);
};
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--lab-accent); }
.animate-in { animation: fadeIn 0.3s ease-out; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }

/* 绿色呼吸灯动画 */
@keyframes breathe {
  0%, 100% { opacity: 1; box-shadow: 0 0 6px #4ade80; }
  50% { opacity: 0.5; box-shadow: 0 0 2px #4ade80; }
}
</style>
