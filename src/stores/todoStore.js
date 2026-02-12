import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { socketService } from '../services/socketService.js';
import { useTerminalStore } from './terminalStore.js';
import { CONFIG } from '../config/index.js';

export const useTodoStore = defineStore('todo', () => {
  // State
  const todos = ref([]);
  const isUploading = ref(false);

  // Getters
  const pendingCount = computed(() => 
    todos.value.filter(t => t.status !== 'done').length
  );

  const todosByStatus = computed(() => (status) => 
    todos.value.filter(t => t.status === status)
  );

  // Actions
  function setTodos(list) {
    todos.value = list;
  }

  function refresh() {
    socketService.emit('get-todos');
  }

  function updateTodos(newList) {
    todos.value = newList;
    socketService.emit('update-todos', newList);
  }

  function addTodo(todo) {
    updateTodos([todo, ...todos.value]);
  }

  function deleteTodo(id) {
    updateTodos(todos.value.filter(t => t.id !== id));
  }

  function updateTodoStatus(id, status) {
    const updated = todos.value.map(t => 
      t.id === id ? { ...t, status } : t
    );
    updateTodos(updated);
  }

  function updateTodoText(id, text, imageUrl = null) {
    const updated = todos.value.map(t => {
      if (t.id === id) {
        return { 
          ...t, 
          text: text.trim(),
          ...(imageUrl !== null && { imageUrl })
        };
      }
      return t;
    });
    updateTodos(updated);
  }

  function removeTodoImage(id) {
    const updated = todos.value.map(t => 
      t.id === id ? { ...t, imageUrl: null } : t
    );
    updateTodos(updated);
  }

  function reorderTodos(newOrder) {
    todos.value = newOrder;
    updateTodos(newOrder);
  }

  async function uploadImage(base64Data) {
    isUploading.value = true;
    
    return new Promise((resolve) => {
      socketService.emit('upload-todo-image', { base64: base64Data }, (res) => {
        isUploading.value = false;
        resolve(res);
      });
    });
  }

  function sendToTerminal(todo, mode = 'inject') {
    const terminalStore = useTerminalStore();
    
    let content = todo.text;
    if (todo.imageUrl) {
      const imagePath = todo.imageUrl.replace('/todo-images/', 'todo-images/');
      content += `\n(REF_IMG: @${imagePath})`;
    }

    if (mode === 'inject') {
      terminalStore.injectText(content);
    } else {
      terminalStore.appendText(content);
    }

    // Auto-mark as doing if it was todo
    if (todo.status === 'todo') {
      updateTodoStatus(todo.id, 'doing');
    }
  }

  function createTodo(text, options = {}) {
    return {
      id: 'todo-' + Date.now(),
      text: text.trim(),
      imageUrl: options.imageUrl || null,
      status: options.status || 'todo',
      category: options.category || '需求',
      createdAt: new Date().toISOString()
    };
  }

  // Socket event handlers
  socketService.on('todo-list', (list) => {
    todos.value = list;
  });

  return {
    // State
    todos,
    isUploading,
    
    // Getters
    pendingCount,
    todosByStatus,
    
    // Actions
    setTodos,
    refresh,
    updateTodos,
    addTodo,
    deleteTodo,
    updateTodoStatus,
    updateTodoText,
    removeTodoImage,
    reorderTodos,
    uploadImage,
    sendToTerminal,
    createTodo,
  };
});
