<template>
  <div class="flex flex-col h-full overflow-hidden">
    <!-- Header -->
    <div class="p-3 bg-lab-surface/20 border-b border-lab-border">
      <div class="flex items-center justify-between">
        <span class="text-[10px] font-bold text-lab-text-dim/70 uppercase tracking-wider">已安装 Skills</span>
        <span class="text-[10px] font-mono text-lab-primary">{{ skills.length }} 个</span>
      </div>
    </div>

    <!-- Skills List -->
    <div class="flex-1 overflow-y-auto custom-scrollbar">
      <div v-if="skills.length === 0" class="py-12 text-center">
        <div class="text-lab-text-dim/30 text-xs italic">暂无已安装 Skills</div>
        <div class="text-lab-text-dim/20 text-[10px] mt-1">使用 gemini skill add 添加</div>
      </div>

      <div v-for="skill in skills" :key="skill.name" 
        class="group relative border-b border-lab-border/30 hover:bg-lab-surface/30 transition-all duration-300"
        :class="selectedSkill?.name === skill.name ? 'bg-lab-surface/50' : ''"
      >
        <!-- Skill Header -->
        <div @click="selectSkill(skill)" class="p-3 cursor-pointer">
          <div class="flex items-start justify-between gap-2">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-gray-100 truncate">{{ skill.name }}</span>
                <span 
                  class="px-1.5 py-0.5 text-[8px] font-black rounded border"
                  :class="skill.enabled ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'"
                >
                  {{ skill.enabled ? '已启用' : '已禁用' }}
                </span>
              </div>
              <p class="text-[10px] text-lab-text-dim/60 mt-1 line-clamp-2 leading-relaxed">{{ skill.description || '暂无描述' }}</p>
            </div>
            
            <!-- Quick Actions -->
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                @click.stop="toggleSkill(skill)"
                class="p-1.5 rounded hover:bg-lab-primary/20 text-lab-text-dim/50 hover:text-lab-primary transition-all"
                :title="skill.enabled ? '禁用' : '启用'"
              >
                <svg v-if="skill.enabled" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <svg v-else class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button 
                @click.stop="deleteSkill(skill)"
                class="p-1.5 rounded hover:bg-red-500/20 text-lab-text-dim/50 hover:text-red-400 transition-all"
                title="删除"
              >
                <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Expanded Detail -->
        <div v-if="selectedSkill?.name === skill.name" class="px-3 pb-3">
          <div class="bg-black/30 rounded-lg p-3 border border-lab-border/50">
            <!-- Location -->
            <div class="mb-2">
              <span class="text-[9px] font-bold text-lab-text-dim/50 uppercase">位置</span>
              <p class="text-[10px] text-lab-text-dim/70 font-mono mt-0.5 break-all">{{ skill.location }}</p>
            </div>
            
            <!-- Doc Preview -->
            <div v-if="skillDoc" class="mt-3">
              <div class="flex items-center justify-between mb-2">
                <span class="text-[9px] font-bold text-lab-text-dim/50 uppercase">文档</span>
                <button 
                  @click="openSkillFolder(skill)"
                  class="text-[9px] text-lab-primary hover:text-lab-accent transition-colors flex items-center gap-1"
                >
                  <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
                  </svg>
                  打开文件夹
                </button>
              </div>
              <div class="bg-black/40 rounded p-2 max-h-48 overflow-y-auto custom-scrollbar">
                <pre class="text-[10px] text-lab-text-dim/80 whitespace-pre-wrap leading-relaxed">{{ skillDoc }}</pre>
              </div>
            </div>
            <div v-else-if="loadingDoc" class="py-4 text-center">
              <div class="w-4 h-4 border-2 border-lab-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer Actions -->
    <div class="p-3 bg-lab-surface/20 border-t border-lab-border">
      <button 
        @click="refreshSkills"
        class="w-full py-2 flex items-center justify-center gap-2 text-[10px] font-bold text-lab-text-dim/70 hover:text-lab-primary hover:bg-lab-primary/10 rounded-lg border border-lab-border/50 hover:border-lab-primary/30 transition-all"
        :disabled="loading"
      >
        <svg v-if="!loading" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        <svg v-else class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        {{ loading ? '刷新中...' : '刷新列表' }}
      </button>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="bg-lab-surface border border-lab-border rounded-xl p-4 m-4 max-w-xs w-full shadow-2xl">
        <h3 class="text-sm font-bold text-gray-100 mb-2">确认删除</h3>
        <p class="text-xs text-lab-text-dim/70 mb-4">确定要删除 Skill "{{ skillToDelete?.name }}" 吗？此操作不可恢复。</p>
        <div class="flex gap-2">
          <button 
            @click="showDeleteModal = false"
            class="flex-1 py-2 text-[10px] font-bold text-lab-text-dim/70 hover:text-gray-100 bg-black/30 hover:bg-black/50 rounded-lg transition-all"
          >
            取消
          </button>
          <button 
            @click="confirmDelete"
            class="flex-1 py-2 text-[10px] font-bold text-white bg-red-500/80 hover:bg-red-500 rounded-lg transition-all"
          >
            删除
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, onActivated } from 'vue';
import { useAppStore } from '../../stores/app';

const store = useAppStore();
const skills = ref([]);
const selectedSkill = ref(null);
const skillDoc = ref('');
const loadingDoc = ref(false);
const loading = ref(false);
const showDeleteModal = ref(false);
const skillToDelete = ref(null);
const hasLoaded = ref(false);

// Socket 事件监听
let unsubscribeCallbacks = [];

const loadSkills = () => {
  if (!hasLoaded.value || skills.value.length === 0) {
    loading.value = true;
    store.socket.emit('get-skills');
    hasLoaded.value = true;
  }
};

onMounted(() => {
  // 监听 skills 更新
  const onSkillList = (data) => {
    skills.value = data;
    loading.value = false;
  };
  store.socket.on('skill-list', onSkillList);
  unsubscribeCallbacks.push(() => store.socket.off('skill-list', onSkillList));

  // 监听文档内容
  const onSkillDoc = ({ skillName, doc }) => {
    if (selectedSkill.value?.name === skillName) {
      skillDoc.value = doc || '无法读取文档';
      loadingDoc.value = false;
    }
  };
  store.socket.on('skill-doc', onSkillDoc);
  unsubscribeCallbacks.push(() => store.socket.off('skill-doc', onSkillDoc));

  // 监听操作结果
  const onOperationResult = (result) => {
    if (!result.success) {
      alert(`操作失败: ${result.error || '未知错误'}`);
    }
  };
  store.socket.on('skill-operation-result', onOperationResult);
  unsubscribeCallbacks.push(() => store.socket.off('skill-operation-result', onOperationResult));

  // 初始加载
  loadSkills();
});

onActivated(() => {
  // KeepAlive 组件激活时重新加载
  loadSkills();
});

onUnmounted(() => {
  unsubscribeCallbacks.forEach(cb => cb());
});

const selectSkill = (skill) => {
  if (selectedSkill.value?.name === skill.name) {
    selectedSkill.value = null;
    skillDoc.value = '';
  } else {
    selectedSkill.value = skill;
    skillDoc.value = '';
    loadingDoc.value = true;
    store.socket.emit('get-skill-doc', skill.name);
  }
};

const toggleSkill = (skill) => {
  // 发送命令到终端执行
  const action = skill.enabled ? 'disable' : 'enable';
  const cmd = `/skills ${action} ${skill.name}`;
  
  // 使用当前活动的终端ID直接发送命令
  if (store.activeTabId) {
    // 先发送 Ctrl+U 清空当前行，然后发送命令
    store.socket.emit('input', { id: store.activeTabId, data: '\x15' });
    setTimeout(() => {
      store.socket.emit('input', { id: store.activeTabId, data: cmd });
      setTimeout(() => {
        store.socket.emit('input', { id: store.activeTabId, data: '\r' });
      }, 50);
    }, 50);
  } else {
    // 如果没有活动终端，创建一个新标签页
    store.createTab('终端', 'terminal-' + Date.now(), cmd);
  }
};

const deleteSkill = (skill) => {
  skillToDelete.value = skill;
  showDeleteModal.value = true;
};

const confirmDelete = () => {
  if (skillToDelete.value) {
    // 发送命令到终端执行
    const cmd = `gemini skill delete ${skillToDelete.value.name}`;
    
    if (store.activeTabId) {
      // 先发送 Ctrl+U 清空当前行，然后发送命令
      store.socket.emit('input', { id: store.activeTabId, data: '\x15' });
      setTimeout(() => {
        store.socket.emit('input', { id: store.activeTabId, data: cmd });
        setTimeout(() => {
          store.socket.emit('input', { id: store.activeTabId, data: '\r' });
        }, 50);
      }, 50);
    } else {
      store.createTab('终端', 'terminal-' + Date.now(), cmd);
    }
    
    if (selectedSkill.value?.name === skillToDelete.value.name) {
      selectedSkill.value = null;
      skillDoc.value = '';
    }
  }
  showDeleteModal.value = false;
  skillToDelete.value = null;
};

const refreshSkills = () => {
  loading.value = true;
  store.socket.emit('get-skills');
};

const openSkillFolder = (skill) => {
  // 打开 skill 所在文件夹
  if (skill.location) {
    // 获取文件夹路径
    const folderPath = skill.location.replace(/\\SKILL\.md$/i, '');
    store.socket.emit('open-folder', folderPath);
  }
};
</script>
