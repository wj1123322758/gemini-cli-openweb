<template>
  <div class="h-0 group-hover:h-auto opacity-0 group-hover:opacity-100 overflow-hidden transition-all duration-500 ease-out">
    <div class="mt-4 pt-3 border-t border-lab-border/30 grid grid-cols-2 gap-2">
      <button 
        @click="$emit('send', 'inject')" 
        class="flex items-center justify-center gap-2 py-2 bg-lab-accent/10 hover:bg-lab-accent/20 text-lab-accent text-[10px] font-black rounded-xl border border-lab-accent/20 transition-all"
      >
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
        </svg>
        注入并清空
      </button>
      
      <button 
        @click="$emit('send', 'append')" 
        class="flex items-center justify-center gap-2 py-2 bg-white/5 hover:bg-white/10 text-white/70 text-[10px] font-black rounded-xl border border-white/10 transition-all"
      >
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        追加输入内容
      </button>
      
      <button 
        v-if="todo.status !== 'doing'"
        @click="$emit('set-status', 'doing')" 
        class="flex items-center justify-center gap-2 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 text-[9px] font-black rounded-xl border border-yellow-500/20 transition-all"
      >
        进行中
      </button>
      
      <button 
        v-if="todo.status !== 'done'"
        @click="$emit('set-status', 'done')" 
        class="flex items-center justify-center gap-2 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 text-[9px] font-black rounded-xl border border-green-500/20 transition-all"
      >
        任务完成
      </button>
      
      <button 
        v-if="todo.status === 'done'"
        @click="$emit('set-status', 'todo')" 
        class="flex items-center justify-center gap-2 py-2 bg-lab-primary/10 hover:bg-lab-primary/20 text-lab-primary text-[9px] font-black rounded-xl border border-lab-primary/20 transition-all"
      >
        重做任务
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  todo: { type: Object, required: true }
});

defineEmits(['set-status', 'send']);
</script>
