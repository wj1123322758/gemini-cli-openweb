<template>
  <div class="flex-1 relative">
    <TerminalView
      v-for="tab in terminalStore.terminals"
      :key="tab.id"
      :id="tab.id"
      :is-active="terminalStore.activeTabId === tab.id"
      :initial-command="tab.initialCommand"
    />
    <EmptyState v-if="terminalStore.terminals.length === 0" />
  </div>
</template>

<script setup>
import { useTerminalStore } from '../../stores';
import TerminalView from '../TerminalView.vue';
import EmptyState from './EmptyState.vue';

const terminalStore = useTerminalStore();
</script>
