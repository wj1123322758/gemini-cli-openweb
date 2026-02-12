<template>
  <div class="h-11 flex items-end px-4 gap-1.5 bg-transparent border-b border-lab-border">
    <TabItem
      v-for="tab in terminalStore.terminals"
      :key="tab.id"
      :tab="tab"
      :is-active="terminalStore.activeTabId === tab.id"
      @activate="terminalStore.setActiveTab(tab.id)"
      @close="terminalStore.closeTab(tab.id)"
    />
  </div>
</template>

<script setup>
import { useTerminalStore } from '../../stores';
import TabItem from './TabItem.vue';

const terminalStore = useTerminalStore();
</script>
