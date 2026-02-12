<template>
  <div v-show="isActive" class="absolute inset-0 flex flex-col overflow-hidden terminal-wrapper z-20">
    <ShortcutToolbar @command="sendCommand" />
    <div ref="terminalContainer" class="flex-1 w-full overflow-hidden" />
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { useTerminalStore } from '../stores';
import { socketService } from '../services/socketService.js';
import { CONFIG } from '../config/index.js';
import ShortcutToolbar from './terminal/ShortcutToolbar.vue';

const props = defineProps({
  id: { type: String, required: true },
  isActive: { type: Boolean, default: false },
  initialCommand: { type: String, default: null }
});

const terminalStore = useTerminalStore();
const terminalContainer = ref(null);

let term = null;
let fitAddon = null;
let outputListener = null;

onMounted(() => {
  initTerminal();
  window.addEventListener('resize', handleResize);
});

onBeforeUnmount(() => {
  cleanup();
  window.removeEventListener('resize', handleResize);
});

function initTerminal() {
  term = createXterm();
  fitAddon = new FitAddon();
  term.loadAddon(fitAddon);
  term.open(terminalContainer.value);
  
  terminalStore.registerXterm(props.id, term);
  
  // Setup data handler
  term.onData(data => {
    terminalStore.sendInput(props.id, data);
  });
  
  // Setup custom key handler
  term.attachCustomKeyEventHandler(handleKeyEvent);
  
  // Setup output listener
  outputListener = ({ id, data }) => {
    if (id === props.id) term.write(data);
  };
  socketService.on('output', outputListener);
  
  // Create terminal on server
  socketService.emit('create-terminal', {
    id: props.id,
    cols: term.cols,
    rows: term.rows
  });
  
  // Send initial command if provided
  if (props.initialCommand) {
    setTimeout(() => {
      terminalStore.sendCommand(props.id, props.initialCommand);
    }, CONFIG.TERMINAL.INITIAL_DELAY);
  }
  
  nextTick(() => {
    handleResize();
    term.focus();
  });
}

function createXterm() {
  return new Terminal({
    cursorBlink: true,
    fontSize: 14,
    lineHeight: 1.2,
    fontFamily: "JetBrains Mono, Fira Code, Menlo, Monaco, 'Courier New', monospace",
    allowProposedApi: true,
    theme: {
      background: 'rgba(15, 17, 21, 0.7)',
      foreground: '#e5e7eb',
      cursor: '#4285f4',
      selectionBackground: 'rgba(66, 133, 244, 0.3)',
      black: '#1e1e1e',
      red: '#ff5c57',
      green: '#5af78e',
      yellow: '#f3f99d',
      blue: '#57c7ff',
      magenta: '#ff6ac1',
      cyan: '#9aedfe',
      white: '#f1f1f1'
    }
  });
}

function handleKeyEvent(e) {
  if (e.type === 'keydown' && e.ctrlKey && e.code === 'KeyY') {
    e.preventDefault();
    sendCommand('\x19');
    return false;
  }
  return true;
}

function sendCommand(cmd) {
  // \x19 is Ctrl+Y, \x03 is Ctrl+C - send directly without return
  const noReturnCommands = ['!', '\x19', '\x03'];
  const addReturn = !noReturnCommands.includes(cmd);
  
  terminalStore.sendCommand(props.id, cmd, addReturn);
  term.focus();
}

function handleResize() {
  if (fitAddon && props.isActive && terminalContainer.value) {
    fitAddon.fit();
    socketService.emit('resize', {
      id: props.id,
      cols: term.cols,
      rows: term.rows
    });
  }
}

function cleanup() {
  if (outputListener) {
    socketService.off('output', outputListener);
  }
  terminalStore.unregisterXterm(props.id);
  term?.dispose();
}

// Watch for activation changes
watch(() => props.isActive, (active) => {
  if (active) {
    nextTick(() => {
      handleResize();
      term?.focus();
    });
  }
});
</script>

<style scoped>
.terminal-wrapper {
  transition: all 0.3s ease;
  background: rgba(15, 17, 21, 0.4);
}

:deep(.xterm-helper-textarea) {
  position: absolute !important;
  opacity: 0 !important;
  z-index: -1 !important;
}
</style>
