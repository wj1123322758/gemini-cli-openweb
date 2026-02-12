<template>
  <div 
    :class="[
      'group relative bg-lab-surface/40 border border-lab-border/50 rounded-2xl p-4 transition-all duration-500 hover:border-lab-accent/30 shadow-sm overflow-hidden',
      todo.status === 'done' ? 'opacity-50 grayscale' : ''
    ]"
    draggable="true"
    @dragstart="$emit('dragstart')"
    @dragover.prevent="$emit('dragover')"
    @drop.stop="$emit('drop')"
  >
    <!-- Meta Header -->
    <div class="flex items-center justify-between mb-3 relative">
      <div class="flex items-center gap-2">
        <span 
          class="px-1.5 py-0.5 text-[8px] font-black rounded-md border tracking-widest uppercase"
          :class="categoryTheme.badge"
        >
          {{ todo.category }}
        </span>
        <span class="text-[9px] text-lab-text-dim/40 font-mono">
          {{ formatDate(todo.createdAt) }}
        </span>
      </div>
      
      <div class="flex items-center gap-2">
        <div 
          v-if="todo.status === 'doing'" 
          class="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse shadow-[0_0_5px_#eab308]"
        />
        <span 
          class="text-[9px] font-black uppercase tracking-widest pr-6"
          :class="statusTheme.color"
        >
          {{ statusTheme.label }}
        </span>
        <button 
          @click="$emit('delete')" 
          class="absolute -right-1 -top-1 p-1 text-lab-text-dim/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>

    <!-- Content -->
    <TodoItemEdit
      v-if="isEditing"
      :todo="todo"
      @save="handleSave"
      @cancel="isEditing = false"
    />
    <TodoItemDisplay
      v-else
      :todo="todo"
      @click="startEdit"
    />

    <!-- Actions -->
    <TodoItemActions
      :todo="todo"
      @set-status="$emit('set-status', $event)"
      @send="$emit('send', $event)"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { formatDate } from '../../utils/formatters.js';
import { getCategoryTheme, getStatusTheme } from '../../utils/categories.js';
import TodoItemEdit from './TodoItemEdit.vue';
import TodoItemDisplay from './TodoItemDisplay.vue';
import TodoItemActions from './TodoItemActions.vue';

const props = defineProps({
  todo: { type: Object, required: true }
});

const emit = defineEmits(['dragstart', 'dragover', 'drop', 'delete', 'set-status', 'send', 'update']);

const isEditing = ref(false);

const categoryTheme = getCategoryTheme(props.todo.category);
const statusTheme = getStatusTheme(props.todo.status);

function startEdit() {
  isEditing.value = true;
}

function handleSave(updates) {
  emit('update', { ...props.todo, ...updates });
  isEditing.value = false;
}
</script>
