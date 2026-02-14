<template>
  <div class="flex flex-col h-full overflow-hidden">
    <!-- Input Console -->
    <div class="p-4 bg-lab-surface/20 border-b border-lab-border shadow-lg">
      <div class="relative group">
        <textarea 
          v-model="newTodoText" 
          placeholder="在此捕获灵感... (Ctrl+V 粘贴截图)" 
          class="w-full h-24 p-3 bg-black/30 border border-lab-border rounded-xl text-xs text-gray-100 placeholder:text-lab-text-dim/30 focus:border-lab-accent/50 focus:ring-4 focus:ring-lab-accent/5 outline-none transition-all duration-300 resize-none custom-scrollbar leading-relaxed"
          @keydown.ctrl.enter="addTodo"
          @paste.stop="handlePaste($event, 'new')"
        ></textarea>
        
        <div v-if="newTodoImageUrl" class="absolute bottom-2 right-2 w-12 h-12 rounded-lg border border-lab-accent overflow-hidden shadow-2xl group/inputimg">
          <img :src="newTodoImageUrl" class="w-full h-full object-cover" />
          <div @click="newTodoImageUrl = null" class="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 group-hover/inputimg:opacity-100 cursor-pointer transition-opacity">
            <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M6 18L18 6M6 6l12 12" /></svg>
          </div>
        </div>
        <div v-if="isUploading" class="absolute bottom-2 right-2 w-12 h-12 flex items-center justify-center bg-black/60 rounded-lg border border-lab-accent/30">
          <div class="w-4 h-4 border-2 border-lab-accent border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>

      <div class="flex items-center justify-between mt-3">
        <div class="flex gap-1 items-center">
          <button @click="filterMode = '全部'"
            class="px-2 py-1 text-[9px] font-bold rounded-full transition-all border"
            :class="filterMode === '全部' ? 'bg-gray-100 text-black border-white' : 'border-lab-border/40 text-lab-text-dim/70 hover:text-lab-text-dim'"
          >全部</button>

          <button v-for="cat in categories" :key="cat" @click="selectedCategory = cat; filterMode = cat"
            class="px-2.5 py-1 text-[9px] font-bold rounded-full transition-all border"
            :class="filterMode === cat ? categoryClass(cat) : 'border-lab-border/40 text-lab-text-dim/70 hover:text-lab-text-dim'"
          >{{ cat }}</button>

          <button @click="filterMode = '已完成'"
            class="px-2 py-1 text-[9px] font-bold rounded-full transition-all border"
            :class="filterMode === '已完成' ? 'bg-green-500 text-white border-green-400' : 'border-lab-border/40 text-lab-text-dim/70 hover:text-lab-text-dim'"
          >已完成</button>
        </div>
        <button @click="addTodo" :disabled="!newTodoText.trim() && !newTodoImageUrl"
          class="px-4 py-1.5 bg-lab-accent text-white text-[10px] font-black rounded-lg hover:brightness-110 disabled:opacity-20 transition-all shadow-lg shadow-lab-accent/20"
        >记录想法</button>
      </div>
    </div>

    <!-- Missions Feed -->
    <div class="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar space-y-4" @dragover.prevent @drop="handleGlobalDrop">
      <div v-if="filteredTodos.length === 0" class="py-20 text-center italic text-xs text-lab-text-dim/20">
        此分类下暂无任务
      </div>
      <div v-for="(todo, index) in filteredTodos" :key="todo.id" 
        draggable="true" @dragstart="handleDragStart(index)" @dragover.prevent="handleDragOver(index)" @drop.stop="handleDrop"
        class="group relative bg-lab-surface/40 border border-lab-border/50 rounded-2xl p-4 transition-all duration-500 hover:border-lab-accent/30 shadow-sm overflow-hidden"
        :class="[todo.status === 'done' ? 'opacity-50 grayscale' : '']"
      >
        <!-- Meta Header with Top-Right Delete -->
        <div class="flex items-center justify-between mb-3 relative">
          <div class="flex items-center gap-2">
            <span class="px-1.5 py-0.5 text-[8px] font-black rounded-md border tracking-widest uppercase" :class="categoryTheme(todo.category)">{{ todo.category }}</span>
            <span class="text-[9px] text-lab-text-dim/40 font-mono">{{ formatDate(todo.createdAt) }}</span>
          </div>
          
          <div class="flex items-center gap-2">
            <div v-if="todo.status === 'doing'" class="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse shadow-[0_0_5px_#eab308]"></div>
            <span class="text-[9px] font-black uppercase tracking-widest pr-6" :class="statusColor(todo.status)">
              {{ todo.status === 'done' ? '已完成' : (todo.status === 'doing' ? '进行中' : '待办') }}
            </span>
            <button @click="deleteTodo(todo.id)" class="absolute -right-1 -top-1 p-1 text-lab-text-dim/20 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"><path d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <!-- Content Engine -->
        <div v-if="editingId === todo.id" class="mb-3">
          <textarea v-model="editBuffer" v-focus @blur="saveEdit(todo)" @keydown.ctrl.enter="saveEdit(todo)" @paste.stop="handlePaste($event, 'edit')"
            class="w-full p-3 bg-black/40 border border-lab-accent rounded-xl text-xs text-white outline-none resize-none min-h-[100px] leading-relaxed"
          ></textarea>
          <div v-if="todo.imageUrl || tempEditImage" class="mt-2 relative inline-block group/editimg">
            <img :src="tempEditImage || todo.imageUrl" class="w-20 h-20 object-cover rounded-xl border border-lab-accent/30" />
            <div @click="removeImageInEdit(todo)" class="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 group-hover/editimg:opacity-100 cursor-pointer rounded-xl transition-all"><svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M6 18L18 6M6 6l12 12" /></svg></div>
          </div>
        </div>
        <div v-else @click="startEdit(todo)" class="cursor-text">
          <p class="text-xs leading-relaxed text-gray-100 break-words whitespace-pre-wrap mb-3">{{ todo.text }}</p>
          <div v-if="todo.imageUrl" class="relative rounded-xl overflow-hidden border border-lab-border/30 hover:border-lab-accent/50 transition-all shadow-sm" @click.stop="openImage(todo.imageUrl)">
            <img :src="todo.imageUrl" class="max-h-40 w-full object-cover bg-black/40" />
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="h-0 group-hover:h-auto opacity-0 group-hover:opacity-100 overflow-hidden transition-all duration-500 ease-out">
          <div class="mt-4 pt-3 border-t border-lab-border/30 grid grid-cols-2 gap-2">
            <button @click="sendTodo(todo, 'inject')" class="flex items-center justify-center gap-2 py-2 bg-lab-accent/10 hover:bg-lab-accent/20 text-lab-accent text-[10px] font-black rounded-xl border border-lab-accent/20 transition-all">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg> 注入并清空
            </button>
            <button @click="sendTodo(todo, 'append')" class="flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 text-white/70 text-[10px] font-black rounded-xl border border-white/10 transition-all">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg> 追加输入内容
            </button>
            
            <button @click="setStatus(todo, 'doing')" v-if="todo.status !== 'doing'" class="flex items-center justify-center gap-2 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 text-[9px] font-black rounded-xl border border-yellow-500/20 transition-all">
              进行中
            </button>
            <button @click="setStatus(todo, 'done')" v-if="todo.status !== 'done'" class="flex items-center justify-center gap-2 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 text-[9px] font-black rounded-xl border border-green-500/20 transition-all">
              任务完成
            </button>
            <button @click="setStatus(todo, 'todo')" v-if="todo.status === 'done'" class="flex items-center justify-center gap-2 py-2 bg-lab-primary/10 hover:bg-lab-primary/20 text-lab-primary text-[9px] font-black rounded-xl border border-lab-primary/20 transition-all">
              重做任务
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAppStore } from '../../stores/app';
import { formatTodoContent } from '../../services/terminalLogic';
import { notificationService } from '../../services/notificationService';

const store = useAppStore();
const newTodoText = ref('');
const newTodoImageUrl = ref(null);
const isUploading = ref(false);
const selectedCategory = ref('需求');
const filterMode = ref('全部');
const categories = ['需求', '修复', '优化', '杂项'];
const draggingIndex = ref(null);

const editingId = ref(null);
const editBuffer = ref('');
const tempEditImage = ref(null);

const vFocus = { mounted: (el) => el.focus() };

// Computed
const filteredTodos = computed(() => {
  let list = [];
  if (filterMode.value === '全部') {
    list = [...store.todos];
  } else if (filterMode.value === '已完成') {
    list = store.todos.filter(t => t.status === 'done');
  } else {
    list = store.todos.filter(t => t.category === filterMode.value);
  }
  return list.sort((a, b) => {
    if (a.status === 'done' && b.status !== 'done') return 1;
    if (a.status !== 'done' && b.status === 'done') return -1;
    return 0;
  });
});

// Actions
const handlePaste = async (e, mode) => {
  const items = e.clipboardData?.items;
  if (!items) return;
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (!file) continue;
      const reader = new FileReader();
      reader.onload = (event) => {
        isUploading.value = true;
        store.socket.emit('upload-todo-image', { base64: event.target.result }, (res) => {
          if (res && res.success) {
            if (mode === 'new') newTodoImageUrl.value = res.url;
            else tempEditImage.value = res.url;
          }
          isUploading.value = false;
        });
      };
      reader.readAsDataURL(file);
    }
  }
};

const setStatus = (todo, status) => {
  let updated = store.todos.map(t => t.id === todo.id ? { ...t, status } : t);
  if (status === 'done') {
    const target = updated.find(t => t.id === todo.id);
    updated = updated.filter(t => t.id !== todo.id);
    updated.push(target);
    
    // Notify task completion
    notificationService.notify('任务完成', {
      body: todo.text,
      tag: todo.id
    });
  }
  store.updateTodos(updated);
};

const sendTodo = (todo, mode) => {
  const content = formatTodoContent(todo);
  store.sendToTerminal(content, mode);
  if (todo.status === 'todo') setStatus(todo, 'doing');
};

const addTodo = () => {
  if (!newTodoText.value.trim() && !newTodoImageUrl.value) return;
  const newTodo = {
    id: 'todo-' + Date.now(),
    text: newTodoText.value.trim(),
    imageUrl: newTodoImageUrl.value,
    status: 'todo',
    category: selectedCategory.value,
    createdAt: new Date().toISOString()
  };
  store.updateTodos([newTodo, ...store.todos]);
  newTodoText.value = '';
  newTodoImageUrl.value = null;
};

const startEdit = (todo) => {
  editingId.value = todo.id;
  editBuffer.value = todo.text;
  tempEditImage.value = null;
};

const saveEdit = (todo) => {
  if (editingId.value === null) return;
  const updated = store.todos.map(t => {
    if (t.id === todo.id) {
      return { 
        ...t, 
        text: editBuffer.value.trim(), 
        imageUrl: tempEditImage.value || t.imageUrl 
      };
    }
    return t;
  });
  store.updateTodos(updated);
  editingId.value = null;
  tempEditImage.value = null;
};

const removeImageInEdit = (todo) => {
  tempEditImage.value = null;
  const updated = store.todos.map(t => t.id === todo.id ? { ...t, imageUrl: null } : t);
  store.updateTodos(updated);
};

const deleteTodo = (id) => {
  if (confirm('确定要删除这个想法吗？')) {
    store.updateTodos(store.todos.filter(t => t.id !== id));
  }
};

const openImage = (url) => window.open(url, '_blank');

// Helpers
const categoryTheme = (cat) => {
  switch (cat) {
    case '需求': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    case '修复': return 'bg-red-500/10 text-red-400 border-red-500/30';
    case '优化': return 'bg-green-500/10 text-green-400 border-green-500/30';
    default: return 'bg-white/5 text-white/40 border-white/10';
  }
};

const categoryClass = (cat) => {
  if (cat === '需求') return 'bg-blue-500 text-white';
  if (cat === '修复') return 'bg-red-500 text-white';
  return 'bg-green-500 text-white';
};

const statusColor = (status) => {
  if (status === 'done') return 'text-green-500/60';
  if (status === 'doing') return 'text-yellow-500';
  return 'text-lab-text-dim/40';
};

const formatDate = (isoStr) => {
  const d = new Date(isoStr);
  return `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
};

// Drag & Drop
const handleDragStart = (index) => draggingIndex.value = index;
const handleDragOver = (index) => {
  if (draggingIndex.value === null || draggingIndex.value === index) return;
  const newList = [...store.todos];
  const item = newList.splice(draggingIndex.value, 1)[0];
  newList.splice(index, 0, item);
  store.todos = newList;
  draggingIndex.value = index;
};
const handleDrop = () => { store.updateTodos(store.todos); draggingIndex.value = null; };
const handleGlobalDrop = () => draggingIndex.value = null;

onMounted(() => store.socket.emit('get-todos'));
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--lab-accent); }
</style>
