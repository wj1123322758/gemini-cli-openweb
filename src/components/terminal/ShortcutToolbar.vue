<template>
  <div class="flex items-center gap-1 p-1.5 bg-lab-surface/40 backdrop-blur-md border-b border-lab-border overflow-x-auto no-scrollbar shrink-0">
    <CommandGroup 
      v-for="(group, index) in commandGroups" 
      :key="index"
      :commands="group.commands"
      :class="group.class"
      :show-divider="index < commandGroups.length - 1"
      @command="$emit('command', $event)"
    />
  </div>
</template>

<script setup>
import CommandGroup from './CommandGroup.vue';

defineEmits(['command']);

const commandGroups = [
  {
    commands: [
      { label: '启动', value: 'gemini', title: '运行 Gemini CLI' },
      { label: 'Shell', value: '!', title: '切换 Shell 模式' },
      { label: '清屏', value: '/clear', title: '清空终端和上下文' },
      { label: '帮助', value: '/help', title: '显示帮助信息' },
    ],
    class: 'pr-2 border-r border-lab-border/30'
  },
  {
    commands: [
      { label: '总结', value: '/compress', title: '压缩并总结当前上下文' },
      { label: '回退', value: '/rewind', title: '浏览并回退消息' },
      { label: '列表', value: '/chat list', title: '列出所有保存的会话' },
    ],
    class: 'px-2 border-r border-lab-border/30'
  },
  {
    commands: [
      { label: '模型', value: '/model', title: '切换 AI 模型' },
      { label: '主题', value: '/theme', title: '切换界面主题' },
      { label: '登录', value: '/auth login', title: '账号登录与认证' },
      { label: 'Vim', value: '/vim', title: '开启/关闭 Vim 模式' },
    ],
    class: 'px-2 border-r border-lab-border/30'
  },
  {
    commands: [
      { label: 'MCP', value: '/mcp list', title: '查看 MCP 服务器列表' },
      { label: '记忆', value: '/memory show', title: '显示当前 AI 记忆内容' },
      { label: 'YOLO', value: '\x19', title: '切换自动批准模式 (Ctrl+Y)' },
    ],
    class: 'pl-2'
  }
];
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
