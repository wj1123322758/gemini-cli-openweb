<template>
  <aside class="flex flex-col bg-lab-surface/60 border-r border-lab-border select-none overflow-hidden w-80 backdrop-blur-2xl">
    <!-- Tab Switcher -->
    <div class="flex p-1.5 bg-black/20 border-b border-lab-border">
      <button 
        @click="activeTab = 'checkpoints'"
        class="flex-1 py-2 text-[11px] font-bold tracking-widest transition-all rounded-md"
        :class="activeTab === 'checkpoints' ? 'bg-lab-surface text-lab-primary shadow-sm border border-lab-primary/20' : 'text-lab-text-dim/40 hover:text-lab-text-dim'"
      >
        会话存档
      </button>
      <button 
        @click="activeTab = 'todos'"
        class="flex-1 py-2 text-[11px] font-bold tracking-widest transition-all rounded-md relative"
        :class="activeTab === 'todos' ? 'bg-lab-surface text-lab-accent shadow-sm border border-lab-accent/20' : 'text-lab-text-dim/40 hover:text-lab-text-dim'"
      >
        任务清单
        <span v-if="pendingTodosCount > 0" class="absolute top-1 right-2 w-1.5 h-1.5 bg-lab-accent rounded-full animate-pulse shadow-[0_0_5px_#ff6ac1]"></span>
      </button>
    </div>

    <!-- Archive View -->
    <div v-if="activeTab === 'checkpoints'" class="flex flex-col h-full overflow-hidden">
      <div class="px-6 py-4 flex-shrink-0 flex items-center justify-between border-b border-lab-border/20">
        <h2 class="text-[10px] font-bold uppercase tracking-widest text-lab-text-dim/60">历史记录</h2>
        <button @click="store.socket.emit('get-checkpoints')" class="p-1 hover:text-lab-primary transition-all hover:rotate-90">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        </button>
      </div>
      <div class="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar space-y-3">
        <div v-if="store.checkpoints.length === 0" class="p-8 text-center italic text-xs text-lab-text-dim/30 border border-dashed border-lab-border rounded-xl">未检测到存档</div>
        <div v-for="session in store.checkpoints" :key="session.tag" @click="toggleExpand(session.tag)" class="p-4 rounded-xl border border-lab-border bg-lab-surface/40 hover:border-lab-primary/40 transition-all cursor-pointer group shadow-sm">
          <div class="flex justify-between items-start mb-2">
            <h3 class="text-sm font-bold text-gray-100 truncate flex-1 pr-2">{{ session.name }}</h3>
            <div class="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-all" @click.stop>
              <button @click="store.smartRun(session.tag, session.name)" class="p-1.5 bg-lab-primary text-white rounded-lg hover:scale-110 shadow-lg shadow-lab-primary/20" title="运行"><svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M4.5 3.5v13l11-6.5-11-6.5z"/></svg></button>
              <button @click="runInNew(session.tag)" class="p-1.5 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600" title="新窗口"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg></button>
              <button @click="handleDelete(session.tag)" class="p-1.5 bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/50" title="删除"><svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
            </div>
          </div>
          <div class="text-[10px] text-lab-text-dim/50 font-mono mb-2">{{ session.time }}</div>
          <div v-if="expandedTag === session.tag" class="space-y-2 mt-3 pt-3 border-t border-lab-border/30 animate-in slide-in-from-top-2 duration-300">
            <p v-for="(p, i) in session.preview.slice(-3)" :key="i" class="text-[11px] text-lab-text-dim/70 border-l-2 border-lab-border/50 pl-3 italic break-words"># {{ p }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Missions View -->
    <div v-else class="flex flex-col h-full overflow-hidden">
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
          <div class="flex gap-1">
            <button v-for="cat in categories" :key="cat" @click="selectedCategory = cat"
              class="px-2.5 py-1 text-[9px] font-bold rounded-full transition-all border"
              :class="selectedCategory === cat ? categoryClass(cat) : 'border-lab-border/30 text-lab-text-dim/40 hover:text-lab-text-dim/60'"
            >{{ cat }}</button>
          </div>
          <button @click="addTodo" :disabled="!newTodoText.trim() && !newTodoImageUrl"
            class="px-4 py-1.5 bg-lab-accent text-white text-[10px] font-black rounded-lg hover:brightness-110 disabled:opacity-20 transition-all shadow-lg shadow-lab-accent/20"
          >记录想法</button>
        </div>
      </div>

      <!-- Missions Feed -->
      <div class="flex-1 overflow-y-auto px-3 py-4 custom-scrollbar space-y-4" @dragover.prevent @drop="handleGlobalDrop">
        <div v-for="(todo, index) in store.todos" :key="todo.id" 
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
            
            <!-- Quick Actions -->
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

          <!-- Elegant Command Grid (Show on Hover) -->
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
  </aside>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useAppStore } from '../stores/app';

const store = useAppStore();
const activeTab = ref('todos');
const expandedTag = ref(null);
const confirmingTag = ref(null);
let confirmTimer = null;

const newTodoText = ref('');
const newTodoImageUrl = ref(null);
const isUploading = ref(false);
const selectedCategory = ref('需求');
const categories = ['需求', '修复', '优化', '杂项'];
const draggingIndex = ref(null);

const editingId = ref(null);
const editBuffer = ref('');
const tempEditImage = ref(null);

const vFocus = { mounted: (el) => el.focus() };

const pendingTodosCount = computed(() => store.todos.filter(t => t.status !== 'done').length);
const todosByStatus = (status) => store.todos.filter(t => t.status === status);

const toggleExpand = (tag) => { expandedTag.value = expandedTag.value === tag ? null : tag; };

const handleDelete = (tag) => {
  if (confirmingTag.value === tag) {
    store.socket.emit('delete-checkpoint', tag);
    confirmingTag.value = null;
    clearTimeout(confirmTimer);
  } else {
    confirmingTag.value = tag;
    clearTimeout(confirmTimer);
    confirmTimer = setTimeout(() => { confirmingTag.value = null; }, 3000);
  }
};

const runInNew = (tag) => {
  const currentPath = store.terminalPaths[store.activeTabId] || store.projectPath;
  const url = `/?tag=${encodeURIComponent(tag)}&path=${encodeURIComponent(currentPath)}`;
  window.open(url, '_blank');
};

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
  const updated = store.todos.map(t => t.id === todo.id ? { ...t, status } : t);
  store.updateTodos(updated);
};

const sendTodo = (todo, mode) => {
  let content = todo.text;
  if (todo.imageUrl) content += `\n(REF_IMG: @${todo.imageUrl.replace('/todo-images/', 'todo-images/')})`;
  store.sendTodoToTerminal(content, mode);
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

const openImage = (url) => window.open(url, '_blank');

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

.animate-ping { animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite; }
@keyframes ping { 75%, 100% { transform: scale(2); opacity: 0; } }
</style>
