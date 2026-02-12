<template>
  <div class="flex flex-col h-screen bg-transparent text-gray-100 font-sans antialiased overflow-hidden">
    <AppHeader />
    
    <main class="flex-1 flex overflow-hidden">
      <Sidebar class="w-80 glass-effect" />
      
      <div class="flex-1 flex flex-col min-w-0 bg-transparent">
        <TabBar />
        <TerminalStack />
      </div>
    </main>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useTerminalStore, useProjectStore, useCheckpointStore } from './stores';
import AppHeader from './components/layout/AppHeader.vue';
import Sidebar from './components/Sidebar.vue';
import TabBar from './components/layout/TabBar.vue';
import TerminalStack from './components/layout/TerminalStack.vue';

const terminalStore = useTerminalStore();
const projectStore = useProjectStore();
const checkpointStore = useCheckpointStore();

onMounted(() => {
  handleAutoLaunch();
  checkpointStore.refresh();
});

function handleAutoLaunch() {
  const urlParams = new URLSearchParams(window.location.search);
  const autoTag = urlParams.get('tag');
  const targetPath = urlParams.get('path');

  if (autoTag) {
    let bootCmd = `gemini /chat resume "${autoTag}"`;
    if (targetPath) {
      bootCmd = `cd "${targetPath}"; ${bootCmd}`;
    }
    terminalStore.createTab(autoTag, 'pop-' + Date.now(), bootCmd);
    window.history.replaceState({}, '', '/');
  } else if (terminalStore.terminals.length === 0) {
    terminalStore.createTab();
  }
}
</script>

<style>
@import './style.css';
</style>
