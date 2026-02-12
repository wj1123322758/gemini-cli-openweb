<template>
  <div class="flex flex-col h-screen bg-transparent text-gray-100 font-sans antialiased overflow-hidden">
    <!-- Header: Modern Lab Style -->
    <header class="h-14 flex items-center justify-between px-6 bg-transparent/80 backdrop-blur-md border-b border-lab-border z-10">
      <div class="flex items-center gap-6 overflow-hidden">
        <h1 class="text-sm font-bold tracking-wider text-lab-accent whitespace-nowrap">
          GEMINI <span class="font-light text-gray-500">| STATION</span>
        </h1>
        
        <div 
          @click="changeProjectPath"
          class="flex items-center gap-2 px-3 py-1.5 bg-lab-surface/50 border border-lab-border rounded-full cursor-pointer hover:border-lab-primary transition-all group overflow-hidden max-w-xl"
        >
          <span class="text-[10px] font-bold text-lab-primary uppercase tracking-tighter opacity-70 group-hover:opacity-100">Path</span>
          <span class="text-xs text-lab-text-dim truncate font-mono">{{ store.projectPath }}</span>
        </div>
      </div>
      
      <div class="flex items-center gap-4">
        <div class="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-green-500">
          <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          系统就绪
        </div>
      </div>
    </header>
    
    <main class="flex-1 flex overflow-hidden">
      <!-- Sidebar -->
      <Sidebar class="w-80 glass-effect" />
      
      <!-- Right Panel -->
      <div class="flex-1 flex flex-col min-w-0 bg-transparent">
        <div class="h-11 flex items-end px-4 gap-1.5 bg-transparent border-b border-lab-border">
          <div 
            v-for="tab in store.terminals" 
            :key="tab.id"
            @click="store.activeTabId = tab.id; store.saveState()"
            class="group relative h-8 px-4 flex items-center gap-3 cursor-pointer rounded-t-lg transition-all duration-200"
            :class="store.activeTabId === tab.id ? 'bg-lab-surface text-white' : 'text-lab-text-dim hover:bg-lab-surface/50'"
          >
            <span class="text-xs font-medium truncate max-w-[120px]">{{ tab.title }}</span>
            <span 
              @click.stop="store.closeTab(tab.id)" 
              class="opacity-0 group-hover:opacity-100 text-xs text-gray-500 hover:text-red-400 p-0.5 rounded"
            >×</span>
            <div v-if="store.activeTabId === tab.id" class="absolute bottom-0 left-2 right-2 h-0.5 bg-lab-primary rounded-full"></div>
          </div>
        </div>

        <div class="flex-1 relative">
          <TerminalView 
            v-for="tab in store.terminals" 
            :key="tab.id"
            :id="tab.id"
            :isActive="store.activeTabId === tab.id"
            :initialCommand="tab.initialCommand"
          />
          <div v-if="store.terminals.length === 0" class="flex items-center justify-center h-full text-lab-text-dim/30 italic text-sm">
            No active processes
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useAppStore } from './stores/app';
import Sidebar from './components/Sidebar.vue';
import TerminalView from './components/TerminalView.vue';

const store = useAppStore();

onMounted(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const autoTag = urlParams.get('tag');
  const targetPath = urlParams.get('path');

  // 如果 URL 显式提供了路径（如点击独立窗口打开），则立即通知后端切换
  if (targetPath) {
    store.socket.emit('set-project-path', targetPath);
  }

  if (autoTag) {
    let bootCmd = `gemini /chat resume "${autoTag}"`;
    // 如果有路径，先 cd 过去
    if (targetPath) bootCmd = `cd "${targetPath}"; ${bootCmd}`;
    store.createTab(autoTag, 'pop-' + Date.now(), bootCmd);
    // 清理 URL 保持整洁
    window.history.replaceState({}, '', '/');
  } else if (store.terminals.length === 0) {
    store.createTab();
  }
});

const changeProjectPath = () => {
  const newPath = prompt("Enter project absolute path:", store.projectPath);
  if (newPath) store.socket.emit('set-project-path', newPath.trim());
};
</script>

<style>
@import './style.css';
</style>
