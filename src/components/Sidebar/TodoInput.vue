<template>
  <div class="p-4 bg-lab-surface/20 border-b border-lab-border shadow-lg">
    <div class="relative group">
      <textarea 
        v-model="text" 
        placeholder="在此捕获灵感... (Ctrl+V 粘贴截图)" 
        class="w-full h-24 p-3 bg-black/30 border border-lab-border rounded-xl text-xs text-gray-100 placeholder:text-lab-text-dim/30 focus:border-lab-accent/50 focus:ring-4 focus:ring-lab-accent/5 outline-none transition-all duration-300 resize-none custom-scrollbar leading-relaxed"
        @keydown.ctrl.enter="handleSubmit"
        @paste.stop="handlePaste"
      />
      
      <div 
        v-if="imageUrl" 
        class="absolute bottom-2 right-2 w-12 h-12 rounded-lg border border-lab-accent overflow-hidden shadow-2xl group/inputimg"
      >
        <img :src="imageUrl" class="w-full h-full object-cover" />
        <div 
          @click="clearImage" 
          class="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 group-hover/inputimg:opacity-100 cursor-pointer transition-opacity"
        >
          <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      </div>
      
      <div 
        v-if="isUploading" 
        class="absolute bottom-2 right-2 w-12 h-12 flex items-center justify-center bg-black/60 rounded-lg border border-lab-accent/30"
      >
        <div class="w-4 h-4 border-2 border-lab-accent border-t-transparent rounded-full animate-spin" />
      </div>
    </div>

    <div class="flex items-center justify-between mt-3">
      <div class="flex gap-1">
        <button 
          v-for="cat in CATEGORIES" 
          :key="cat" 
          @click="selectedCategory = cat"
          class="px-2.5 py-1 text-[9px] font-bold rounded-full transition-all border"
          :class="selectedCategory === cat 
            ? getCategoryTheme(cat).button 
            : 'border-lab-border/30 text-lab-text-dim/40 hover:text-lab-text-dim/60'"
        >
          {{ cat }}
        </button>
      </div>
      <button 
        @click="handleSubmit" 
        :disabled="!canSubmit"
        class="px-4 py-1.5 bg-lab-accent text-white text-[10px] font-black rounded-lg hover:brightness-110 disabled:opacity-20 transition-all shadow-lg shadow-lab-accent/20"
      >
        记录想法
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useTodoStore } from '../../stores';
import { CATEGORIES, getCategoryTheme } from '../../utils/categories.js';

const todoStore = useTodoStore();

const text = ref('');
const imageUrl = ref(null);
const selectedCategory = ref('需求');

const isUploading = computed(() => todoStore.isUploading);
const canSubmit = computed(() => text.value.trim() || imageUrl.value);

function clearImage() {
  imageUrl.value = null;
}

function handleSubmit() {
  if (!canSubmit.value) return;
  
  const todo = todoStore.createTodo(text.value, {
    imageUrl: imageUrl.value,
    category: selectedCategory.value,
  });
  
  todoStore.addTodo(todo);
  
  // Reset form
  text.value = '';
  imageUrl.value = null;
}

async function handlePaste(e) {
  const items = e.clipboardData?.items;
  if (!items) return;
  
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (!file) continue;
      
      const reader = new FileReader();
      reader.onload = async (event) => {
        const result = await todoStore.uploadImage(event.target.result);
        if (result?.success) {
          imageUrl.value = result.url;
        }
      };
      reader.readAsDataURL(file);
    }
  }
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
</style>
