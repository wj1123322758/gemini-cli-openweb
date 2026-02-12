<template>
  <aside class="flex flex-col bg-lab-surface/60 border-r border-lab-border select-none overflow-hidden w-80 backdrop-blur-2xl">
    <!-- Top Navigation Tabs -->
    <div class="flex p-1.5 bg-black/20 border-b border-lab-border">
      <button 
        @click="switchTab('checkpoints')"
        class="flex-1 py-2 text-[10px] font-bold tracking-tight rounded-md outline-none whitespace-nowrap transition-all"
        :class="activeTab === 'checkpoints' ? 'bg-lab-surface text-lab-primary border border-lab-primary/20' : 'text-lab-text-dim/70 hover:text-lab-text-dim'"
      >
        会话存档
      </button>
      <button 
        @click="switchTab('resumes')"
        class="flex-1 py-2 text-[10px] font-bold tracking-tight rounded-md outline-none whitespace-nowrap mx-1 transition-all"
        :class="activeTab === 'resumes' ? 'bg-lab-surface text-lab-accent border border-lab-accent/20' : 'text-lab-text-dim/70 hover:text-lab-text-dim'"
      >
        最近记录
      </button>
      <button 
        @click="switchTab('todos')"
        class="flex-1 py-2 text-[10px] font-bold tracking-tight rounded-md relative outline-none whitespace-nowrap transition-all"
        :class="activeTab === 'todos' ? 'bg-lab-surface text-lab-primary border border-lab-primary/20' : 'text-lab-text-dim/70 hover:text-lab-text-dim'"
      >
        任务清单
        <span v-if="pendingTodosCount > 0" class="absolute top-1 right-2 w-1.5 h-1.5 bg-lab-accent rounded-full animate-pulse shadow-[0_0_5px_#ff6ac1]"></span>
      </button>
    </div>

    <!-- Content Area (Dynamic Components) -->
    <div class="flex-1 overflow-hidden relative">
      <KeepAlive>
        <component :is="currentView" />
      </KeepAlive>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, shallowRef } from 'vue';
import { useAppStore } from '../stores/app';

// Import Sub-components
import ArchiveList from './sidebar/ArchiveList.vue';
import ResumeList from './sidebar/ResumeList.vue';
import TodoList from './sidebar/TodoList.vue';

const store = useAppStore();
const activeTab = ref('todos');

// Map tab names to components
const currentView = computed(() => {
  switch (activeTab.value) {
    case 'checkpoints': return ArchiveList;
    case 'resumes': return ResumeList;
    case 'todos': return TodoList;
    default: return TodoList;
  }
});

const pendingTodosCount = computed(() => store.todos.filter(t => t.status !== 'done').length);

const switchTab = (tab) => {
  activeTab.value = tab;
  // Trigger initial fetch when switching tabs
  if (tab === 'checkpoints') store.socket.emit('get-checkpoints');
  if (tab === 'resumes') store.socket.emit('get-resumes');
  if (tab === 'todos') store.socket.emit('get-todos');
};
</script>
