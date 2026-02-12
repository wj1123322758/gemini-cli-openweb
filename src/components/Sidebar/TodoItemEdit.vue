<template>
  <div class="mb-3">
    <textarea 
      v-model="editText"
      v-focus
      @blur="handleBlur"
      @keydown.ctrl.enter="handleSave"
      @paste.stop="handlePaste"
      class="w-full p-3 bg-black/40 border border-lab-accent rounded-xl text-xs text-white outline-none resize-none min-h-[100px] leading-relaxed"
    />
    <div 
      v-if="currentImage" 
      class="mt-2 relative inline-block group/editimg"
    >
      <img :src="currentImage" class="w-20 h-20 object-cover rounded-xl border border-lab-accent/30" />
      <div 
        @click="removeImage" 
        class="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 group-hover/editimg:opacity-100 cursor-pointer rounded-xl transition-all"
      >
        <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useTodoStore } from '../../stores';

const props = defineProps({
  todo: { type: Object, required: true }
});

const emit = defineEmits(['save', 'cancel']);

const todoStore = useTodoStore();

const editText = ref(props.todo.text);
const tempImage = ref(null);

const currentImage = computed(() => tempImage.value || props.todo.imageUrl);

const vFocus = {
  mounted: (el) => el.focus()
};

function handleSave() {
  emit('save', {
    text: editText.value,
    imageUrl: tempImage.value !== null ? tempImage.value : props.todo.imageUrl
  });
}

function handleBlur() {
  // Small delay to allow click events on buttons to fire first
  setTimeout(() => {
    if (!document.activeElement?.closest('.group/editimg')) {
      handleSave();
    }
  }, 200);
}

function removeImage() {
  tempImage.value = null;
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
          tempImage.value = result.url;
        }
      };
      reader.readAsDataURL(file);
    }
  }
}
</script>
