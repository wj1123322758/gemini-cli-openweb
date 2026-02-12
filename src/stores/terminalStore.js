import { defineStore } from 'pinia';
import { ref, computed, shallowRef } from 'vue';
import { socketService } from '../services/socketService.js';
import { CONFIG } from '../config/index.js';

export const useTerminalStore = defineStore('terminal', () => {
  // State
  const terminals = ref([]);
  const activeTabId = ref(null);
  const terminalPaths = ref({});
  const xtermInstances = shallowRef(new Map());
  
  // Check if this is a pop-out window
  const params = new URLSearchParams(window.location.search);
  const isPopOut = params.has('tag');
  
  // Initialize from session storage (only for main window)
  const savedTabs = isPopOut ? [] : JSON.parse(sessionStorage.getItem(CONFIG.STORAGE_KEYS.TABS) || '[]');
  terminals.value = savedTabs;
  activeTabId.value = isPopOut ? null : sessionStorage.getItem(CONFIG.STORAGE_KEYS.ACTIVE_TAB);

  // Getters
  const activeTerminal = computed(() => {
    return terminals.value.find(t => t.id === activeTabId.value);
  });

  const activePath = computed(() => {
    return terminalPaths.value[activeTabId.value] || '';
  });

  // Actions
  function saveState() {
    if (isPopOut) return;
    
    const tabsData = terminals.value.map(t => ({ 
      id: t.id, 
      title: t.title 
    }));
    sessionStorage.setItem(CONFIG.STORAGE_KEYS.TABS, JSON.stringify(tabsData));
    sessionStorage.setItem(CONFIG.STORAGE_KEYS.ACTIVE_TAB, activeTabId.value);
  }

  function createTab(title = null, id = null, initialCommand = null) {
    const termId = id || 'term-' + Date.now();
    
    const existing = terminals.value.find(t => t.id === termId);
    if (existing) return termId;

    terminals.value.push({
      id: termId,
      title: title || `Terminal ${terminals.value.length + 1}`,
      initialCommand
    });
    
    activeTabId.value = termId;
    saveState();
    return termId;
  }

  function closeTab(id) {
    // Handle last tab closure
    if (terminals.value.length <= 1) {
      if (isPopOut) {
        window.close();
      } else {
        sessionStorage.clear();
        location.reload();
      }
      return;
    }

    terminals.value = terminals.value.filter(t => t.id !== id);
    socketService.emit('close-terminal', id);
    
    if (activeTabId.value === id) {
      activeTabId.value = terminals.value[0]?.id || null;
    }
    
    xtermInstances.value.delete(id);
    saveState();
  }

  function setActiveTab(id) {
    activeTabId.value = id;
    saveState();
  }

  function updateTabTitle(id, title) {
    const tab = terminals.value.find(t => t.id === id);
    if (tab) {
      tab.title = title;
      saveState();
    }
  }

  function updateTerminalPath(id, path) {
    terminalPaths.value[id] = path;
  }

  function registerXterm(id, instance) {
    xtermInstances.value.set(id, instance);
  }

  function unregisterXterm(id) {
    xtermInstances.value.delete(id);
  }

  function sendInput(id, data) {
    socketService.emit('input', { id, data });
  }

  function sendCommand(id, command, addReturn = true) {
    socketService.emit('input', { id, data: command });
    
    if (addReturn) {
      setTimeout(() => {
        socketService.emit('input', { id, data: '\r' });
      }, CONFIG.TERMINAL.COMMAND_DELAY);
    }
  }

  function injectText(text) {
    if (!activeTabId.value) {
      createTab();
    }
    
    const id = activeTabId.value;
    
    // Clear current line (Ctrl+U)
    socketService.emit('input', { id, data: '\x15' });
    
    setTimeout(() => {
      socketService.emit('input', { id, data: text });
    }, CONFIG.TERMINAL.INJECT_DELAY);
  }

  function appendText(text) {
    if (!activeTabId.value) {
      createTab();
    }
    socketService.emit('input', { id: activeTabId.value, data: text });
  }

  // Socket event handlers
  socketService.on('terminal-cwd', ({ id, path }) => {
    terminalPaths.value[id] = path;
  });

  return {
    // State
    terminals,
    activeTabId,
    terminalPaths,
    xtermInstances,
    isPopOut,
    
    // Getters
    activeTerminal,
    activePath,
    
    // Actions
    createTab,
    closeTab,
    setActiveTab,
    updateTabTitle,
    updateTerminalPath,
    registerXterm,
    unregisterXterm,
    sendInput,
    sendCommand,
    injectText,
    appendText,
    saveState,
  };
});
