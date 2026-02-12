import { defineStore } from 'pinia';
import { ref } from 'vue';
import { socketService } from '../services/socketService.js';
import { useTerminalStore } from './terminalStore.js';
import { CONFIG } from '../config/index.js';

export const useCheckpointStore = defineStore('checkpoint', () => {
  // State
  const checkpoints = ref([]);

  // Actions
  function setCheckpoints(list) {
    checkpoints.value = list;
  }

  function refresh() {
    socketService.emit('get-checkpoints');
  }

  function deleteCheckpoint(tag) {
    socketService.emit('delete-checkpoint', tag);
  }

  function resumeInNewWindow(tag, targetPath) {
    const currentPath = targetPath || useTerminalStore().activePath || useProjectStore().projectPath;
    const url = `/?tag=${encodeURIComponent(tag)}&path=${encodeURIComponent(currentPath)}`;
    window.open(url, '_blank');
  }

  function detectGeminiMode(term) {
    if (!term) return false;
    
    const buffer = term.buffer.active;
    const lastLineIdx = buffer.cursorY + buffer.baseY;
    
    for (let i = lastLineIdx; i >= Math.max(0, lastLineIdx - 10); i--) {
      const line = buffer.getLine(i)?.translateToString().trim() || '';
      
      // PowerShell prompt
      if (line.includes('PS ') && line.includes(':\\')) {
        return false;
      }
      // Gemini prompt
      if (line.startsWith('>') || line.includes('gemini>')) {
        return true;
      }
    }
    return false;
  }

  function smartRun(tag, name) {
    const terminalStore = useTerminalStore();
    
    if (!terminalStore.activeTabId) {
      terminalStore.createTab();
    }

    // Update tab title
    terminalStore.updateTabTitle(terminalStore.activeTabId, name);

    // Detect if currently in Gemini CLI
    const term = terminalStore.xtermInstances.get(terminalStore.activeTabId);
    const isInGemini = detectGeminiMode(term);

    // Send interrupt
    socketService.emit('input', { 
      id: terminalStore.activeTabId, 
      data: '\x03' 
    });

    setTimeout(() => {
      const cmd = isInGemini 
        ? `/chat resume "${tag}"` 
        : `gemini /chat resume "${tag}"`;
      
      socketService.emit('input', { id: terminalStore.activeTabId, data: cmd });
      
      setTimeout(() => {
        socketService.emit('input', { id: terminalStore.activeTabId, data: '\r' });
      }, CONFIG.TERMINAL.COMMAND_DELAY);
    }, CONFIG.TERMINAL.RESUME_DELAY);
  }

  // Socket event handlers
  socketService.on('checkpoint-list', (list) => {
    checkpoints.value = list;
  });

  return {
    checkpoints,
    setCheckpoints,
    refresh,
    deleteCheckpoint,
    resumeInNewWindow,
    smartRun,
  };
});

// Avoid circular dependency
import { useProjectStore } from './projectStore.js';
