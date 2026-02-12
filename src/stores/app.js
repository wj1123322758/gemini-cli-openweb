import { defineStore } from 'pinia'
import { io } from 'socket.io-client'
import { ref, shallowRef } from 'vue'
import { checkIsInGemini } from '../services/terminalLogic'

export const useAppStore = defineStore('app', () => {
    const socket = io('http://localhost:3001');
    const projectPath = ref(localStorage.getItem('gemini_path') || '');
    const checkpoints = ref([]);
    const todos = ref([]);
    
    const params = new URLSearchParams(window.location.search);
    const isPopOut = params.has('tag');
    const savedTabs = isPopOut ? [] : JSON.parse(sessionStorage.getItem('win_tabs') || '[]');
    
    const terminals = ref(savedTabs);
    const activeTabId = ref(isPopOut ? null : sessionStorage.getItem('win_active'));
    const terminalPaths = ref({});
    const xtermInstances = shallowRef(new Map());

    function saveState() {
        if (isPopOut) return; 
        sessionStorage.setItem('win_tabs', JSON.stringify(terminals.value.map(t => ({ id: t.id, title: t.title }))));
        sessionStorage.setItem('win_active', activeTabId.value);
    }

    // --- Socket Listeners ---
    socket.on('project-info', ({ path }) => {
        projectPath.value = path;
        localStorage.setItem('gemini_path', path);
    });
    socket.on('checkpoint-list', (list) => checkpoints.value = list);
    socket.on('todo-list', (list) => todos.value = list);
    socket.on('terminal-cwd', ({ id, path }) => {
        terminalPaths.value[id] = path;
        // 只有当前活跃标签页的路径变更才同步全局项目路径
        if (activeTabId.value === id) {
            socket.emit('set-project-path', path);
        }
    });

    function createTab(title = null, id = null, initialCommand = null) {
        const termId = id || 'term-' + Date.now();
        if (terminals.value.find(t => t.id === termId)) return termId;

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
        if (terminals.value.length <= 1 && !isPopOut) {
            sessionStorage.clear();
            location.reload();
            return;
        }
        if (isPopOut && terminals.value.length <= 1) {
            window.close();
            return;
        }
        terminals.value = terminals.value.filter(t => t.id !== id);
        socket.emit('close-terminal', id);
        if (activeTabId.value === id) activeTabId.value = terminals.value[0]?.id || null;
        saveState();
    }

    function updateTodos(newList) {
        todos.value = newList;
        socket.emit('update-todos', newList);
    }

    function sendToTerminal(data, mode = 'append') {
        if (!activeTabId.value) createTab();
        if (mode === 'inject') {
            socket.emit('input', { id: activeTabId.value, data: '\x15' }); // Ctrl+U
            setTimeout(() => {
                socket.emit('input', { id: activeTabId.value, data: data });
            }, 50);
        } else {
            socket.emit('input', { id: activeTabId.value, data: data });
        }
    }

    function smartRun(tag, name) {
        if (!activeTabId.value) createTab();
        const currentTab = terminals.value.find(t => t.id === activeTabId.value);
        if (currentTab) currentTab.title = name;
        saveState();

        const term = xtermInstances.value.get(activeTabId.value);
        const isInGemini = checkIsInGemini(term);

        socket.emit('input', { id: activeTabId.value, data: '\x03' }); // Ctrl+C
        setTimeout(() => {
            const cmd = isInGemini ? `/chat resume "${tag}"` : `gemini /chat resume "${tag}"`;
            socket.emit('input', { id: activeTabId.value, data: cmd });
            setTimeout(() => {
                socket.emit('input', { id: activeTabId.value, data: '\r' });
            }, 50);
        }, 500);
    }

    return {
        socket, projectPath, checkpoints, todos, terminals, activeTabId, 
        terminalPaths, xtermInstances,
        createTab, closeTab, saveState, smartRun, updateTodos, sendToTerminal
    };
});
