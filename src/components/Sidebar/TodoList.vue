<template>
  <div class="flex flex-col h-full overflow-hidden">
    <TodoInput />
    
    <div 
      class="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar space-y-4"
      @dragover.prevent
      @drop="handleGlobalDrop"
    >
      <TodoItem
        v-for="(todo, index) in todoStore.todos"
        :key="todo.id"
        :todo="todo"
        @dragstart="handleDragStart(index)"
        @dragover="handleDragOver(index)"
        @drop="handleDrop"
        @delete="todoStore.deleteTodo(todo.id)"
        @set-status="todoStore.updateTodoStatus(todo.id, $event)"
        @send="todoStore.sendToTerminal(todo, $event)"
        @update="handleUpdate"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useTodoStore } from '../../stores';
import TodoInput from './TodoInput.vue';
import TodoItem from './TodoItem.vue';

const todoStore = useTodoStore();

const draggingIndex = ref(null);

function handleDragStart(index) {
  draggingIndex.value = index;
}

function handleDragOver(index) {
  if (draggingIndex.value === null || draggingIndex.value === index) return;
  
  const newList = [...todoStore.todos];
  const item = newList.splice(draggingIndex.value, 1)[0];
  newList.splice(index, 0, item);
  
  todoStore.todos = newList;
  draggingIndex.value = index;
}

function handleDrop() {
  todoStore.reorderTodos(todoStore.todos);
  draggingIndex.value = null;
}

function handleGlobalDrop() {
  draggingIndex.value = null;
}

function handleUpdate(updatedTodo) {
  todoStore.updateTodoText(
    updatedTodo.id, 
    updatedTodo.text, 
    updatedTodo.imageUrl
  );
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--lab-accent); }
</style>
