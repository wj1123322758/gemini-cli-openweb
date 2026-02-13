import { defineStore } from 'pinia';
import { ref } from 'vue';
import { io } from 'socket.io-client';
import { checkIsInGemini } from '../services/terminalLogic'

export const useAppStore = defineStore('app', () => {
    const socket = io('http://localhost:3001');
    const projectPath = ref(localStorage.getItem('gemini_path') || '');
    const checkpoints = ref([]);
    const resumes = ref([]);
    const todos = ref([]);
    
    const params = new URLSearchParams(window.location.search);
    const urlPath = params.get('path');
    if (urlPath) projectPath.value = urlPath;

    const terminals = ref(JSON.parse(localStorage.getItem('gemini_tabs') || '[]'));
    const activeTabId = ref(localStorage.getItem('gemini_active_tab') || '');
    const terminalPaths = ref(JSON.parse(localStorage.getItem('gemini_terminal_paths') || '{}'));
    const xtermInstances = ref(new Map());

    function createTab(title = 'Terminal', id = 'term-' + Date.now(), initialCommand = null) {
        const newId = id || 'term-' + Date.now();
        terminals.value.push({ id: newId, title });
        activeTabId.value = newId;
        saveState();
        return newId;
    }

    function closeTab(id) {
        const idx = terminals.value.findIndex(t => t.id === id);
        if (idx === -1) return;
        terminals.value.splice(idx, 1);
        if (terminals.value.length > 0) {
            activeTabId.value = terminals.value[Math.min(idx, terminals.value.length - 1)].id;
        } else {
            activeTabId.value = '';
        }
        saveState();
    }

    function saveState() {
        localStorage.setItem('gemini_tabs', JSON.stringify(terminals.value));
        localStorage.setItem('gemini_active_tab', activeTabId.value);
        localStorage.setItem('gemini_terminal_paths', JSON.stringify(terminalPaths.value));
    }

    socket.on('project-info', ({ path }) => {
        projectPath.value = path;
        localStorage.setItem('gemini_path', path);
    });
    socket.on('checkpoint-list', (list) => checkpoints.value = list);
    socket.on('resume-list', (list) => resumes.value = list);
    socket.on('todo-list', (list) => todos.value = list);
    socket.on('terminal-cwd', ({ id, path }) => {
        terminalPaths.value[id] = path;
        // 如果当前激活的终端路径变了，同步更新全局 projectPath
        if (id === activeTabId.value && path !== projectPath.value) {
            projectPath.value = path;
            localStorage.setItem('gemini_path', path);
            // 通知后端切换项目，以便获取对应项目的 checkpoints/resumes/todos
            socket.emit('set-project-path', path);
        }
        saveState();
    });

    function updateTodos(todos) {
        socket.emit('update-todos', todos);
    }

    function sendToTerminal(id, data) {
        socket.emit('input', { id, data });
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
            // 如果 tag 为空，则不带 tag 参数（恢复默认 checkpoint-.json）
            const cmd = tag 
                ? (isInGemini ? `/chat resume "${tag}"` : `gemini /chat resume "${tag}"`)
                : (isInGemini ? `/chat resume` : `gemini /chat resume`);
            socket.emit('input', { id: activeTabId.value, data: cmd });
            setTimeout(() => {
                socket.emit('input', { id: activeTabId.value, data: '\r' });
            }, 50);
        }, 500);
    }

    /**
     * 恢复自动保存的 session
     * 注意：/resume 命令不接受参数，只能打开浏览器
     * 要直接恢复必须用 gemini --resume <index> 在 shell 中执行
     */
    async function resumeSession(targetPath, name, index) {
        if (!activeTabId.value) createTab();
        if (!targetPath) {
            alert('无法确定项目路径');
            return;
        }
        
        const currentTab = terminals.value.find(t => t.id === activeTabId.value);
        if (currentTab) currentTab.title = name || '恢复会话';
        saveState();

        const term = xtermInstances.value.get(activeTabId.value);
        const isInGemini = checkIsInGemini(term);

        if (isInGemini) {
            // 在 gemini 内：先退出，等待完全退出后再执行恢复
            socket.emit('input', { id: activeTabId.value, data: '\x03' }); // Ctrl+C
            setTimeout(() => {
                socket.emit('input', { id: activeTabId.value, data: '\x03' }); // 再按一次确保退出
                setTimeout(() => {
                    doResume(targetPath, index);
                }, 500);
            }, 500);
        } else {
            // 在 shell 外：直接恢复
            doResume(targetPath, index);
        }
    }

    function doResume(targetPath, index) {
        // cd 到目标路径
        socket.emit('input', { id: activeTabId.value, data: 'cd "' + targetPath + '"' });
        socket.emit('input', { id: activeTabId.value, data: '\r' });
        
        setTimeout(() => {
            const indexStr = index !== undefined ? ` ${index}` : '';
            socket.emit('input', { id: activeTabId.value, data: `gemini --resume${indexStr}` });
            setTimeout(() => {
                socket.emit('input', { id: activeTabId.value, data: '\r' });
            }, 100);
        }, 300);
    }

    return {
        socket, projectPath, checkpoints, resumes, todos, terminals, activeTabId, 
        terminalPaths, xtermInstances,
        createTab, closeTab, saveState, smartRun, resumeSession, updateTodos, sendToTerminal
    };
});
