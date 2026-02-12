<template>
  <aside class="flex flex-col bg-lab-surface/60 border-r border-lab-border select-none overflow-hidden w-80 backdrop-blur-2xl">
    <TabSwitcher 
      v-model="activeTab" 
      :pending-count="todoStore.pendingCount" 
    />
    
    <CheckpointList v-if="activeTab === 'checkpoints'" />
    <TodoList v-else />
  </aside>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useTodoStore } from '../stores';
import TabSwitcher from './sidebar/TabSwitcher.vue';
import CheckpointList from './sidebar/CheckpointList.vue';
import TodoList from './sidebar/TodoList.vue';

const todoStore = useTodoStore();
const activeTab = ref('todos');

onMounted(() => {
  todoStore.refresh();
});
</script>
