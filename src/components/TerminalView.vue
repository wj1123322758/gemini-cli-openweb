<template>
  <div v-show="isActive" class="absolute inset-0 flex flex-col overflow-hidden terminal-wrapper z-20">
    <!-- Shortcut Toolbar -->
    <div class="flex items-center gap-1 p-1.5 bg-lab-surface/40 backdrop-blur-md border-b border-lab-border overflow-x-auto no-scrollbar shrink-0">
      <div class="flex items-center gap-1 pr-2 border-r border-lab-border/30">
        <button v-for="cmd in basicCmds" :key="cmd.label" @click="sendCommand(cmd.value)" 
          class="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-lab-text-dim hover:text-lab-primary hover:bg-lab-primary/10 rounded transition-all whitespace-nowrap"
          :title="cmd.title">
          {{ cmd.label }}
        </button>
      </div>
      
      <div class="flex items-center gap-1 px-2 border-r border-lab-border/30">
        <button v-for="cmd in sessionCmds" :key="cmd.label" @click="sendCommand(cmd.value)" 
          class="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-lab-text-dim hover:text-lab-accent hover:bg-lab-accent/10 rounded transition-all whitespace-nowrap"
          :title="cmd.title">
          {{ cmd.label }}
        </button>
      </div>

      <div class="flex items-center gap-1 px-2 border-r border-lab-border/30">
        <button v-for="cmd in systemCmds" :key="cmd.label" @click="sendCommand(cmd.value)" 
          class="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-lab-text-dim hover:text-yellow-500 hover:bg-yellow-500/10 rounded transition-all whitespace-nowrap"
          :title="cmd.title">
          {{ cmd.label }}
        </button>
      </div>

      <div class="flex items-center gap-1 pl-2">
        <button v-for="cmd in toolCmds" :key="cmd.label" @click="sendCommand(cmd.value)" 
          class="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-lab-text-dim hover:text-green-500 hover:bg-green-500/10 rounded transition-all whitespace-nowrap"
          :title="cmd.title">
          {{ cmd.label }}
        </button>
      </div>
    </div>

    <!-- Terminal Container -->
    <div ref="terminalContainer" class="flex-1 w-full overflow-hidden"></div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'
import { useAppStore } from '../stores/app'

const props = defineProps(['id', 'isActive', 'initialCommand'])
const store = useAppStore()
const terminalContainer = ref(null)
let term = null
let fitAddon = null

const basicCmds = [
  { label: 'Shell', value: '!', title: '切换 Shell 模式' },
  { label: 'Clear', value: '/clear', title: '清空终端和上下文' },
  { label: 'Help', value: '/help', title: '显示帮助' },
]

const sessionCmds = [
  { label: 'Summary', value: '/compress', title: '压缩并总结上下文' },
  { label: 'Rewind', value: '/rewind', title: '回退消息' },
  { label: 'List', value: '/chat list', title: '列出保存的会话' },
]

const systemCmds = [
  { label: 'Model', value: '/model', title: '切换模型' },
  { label: 'Theme', value: '/theme', title: '切换主题' },
  { label: 'Login', value: '/auth login', title: '登录/认证' },
  { label: 'Vim', value: '/vim', title: '切换 Vim 模式' },
]

const toolCmds = [
  { label: 'MCP', value: '/mcp list', title: '列出 MCP 服务器' },
  { label: 'Mem', value: '/memory show', title: '显示记忆内容' },
  { label: 'YOLO', value: '\x19', title: '切换自动批准模式 (Ctrl+Y)' },
]

const sendCommand = (cmd) => {
  // \x19 是 Ctrl+Y 的控制码，直接发送，不加回车
  if (cmd === '!' || cmd === '\x19') {
    store.socket.emit('input', { id: props.id, data: cmd })
  } else {
    // 很多终端模拟器对 \r (Carriage Return) 反应更灵敏
    // 模拟快速键入：先发送字符，再发送回车
    store.socket.emit('input', { id: props.id, data: cmd })
    setTimeout(() => {
      store.socket.emit('input', { id: props.id, data: '\r' })
    }, 20)
  }
  term.focus()
}

const handleKeyDown = (e) => {
  // 保持全局监听仅用于非焦点状态（可选），或者如果已有 xterm 处理器则可以精简
  if (!props.isActive) return
  if (e.ctrlKey && e.code === 'KeyY') {
    e.preventDefault()
    sendCommand('\x19')
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  term = new Terminal({
    cursorBlink: true,
    fontSize: 14,
    lineHeight: 1.2,
    fontFamily: "JetBrains Mono, Fira Code, Menlo, Monaco, 'Courier New', monospace",
    allowProposedApi: true,
    theme: {
      background: 'rgba(15, 17, 21, 0.7)',
      foreground: '#e5e7eb',
      cursor: '#4285f4',
      selectionBackground: 'rgba(66, 133, 244, 0.3)',
      black: '#1e1e1e',
      red: '#ff5c57',
      green: '#5af78e',
      yellow: '#f3f99d',
      blue: '#57c7ff',
      magenta: '#ff6ac1',
      cyan: '#9aedfe',
      white: '#f1f1f1'
    }
  })

  fitAddon = new FitAddon()
  term.loadAddon(fitAddon)
  term.open(terminalContainer.value)
  
  store.xtermInstances.set(props.id, term)
  term.onData(data => store.socket.emit('input', { id: props.id, data }))

  term.attachCustomKeyEventHandler((e) => {
    if (e.type === 'keydown' && e.ctrlKey && e.code === 'KeyY') {
      e.preventDefault()
      sendCommand('\x19')
      return false // 阻止事件进一步传播给终端
    }
    return true
  })

  const outputListener = ({ id, data }) => {
    if (id === props.id) term.write(data)
  }
  store.socket.on('output', outputListener)

  store.socket.emit('create-terminal', { id: props.id, cols: term.cols, rows: term.rows })

  if (props.initialCommand) {
    setTimeout(() => {
      // 启动指令也改为先发内容再发 \r
      store.socket.emit('input', { id: props.id, data: props.initialCommand })
      setTimeout(() => {
        store.socket.emit('input', { id: props.id, data: '\r' })
      }, 50)
    }, 800)
  }

  window.addEventListener('resize', handleResize)
  nextTick(() => {
    handleResize()
    term.focus()
  })

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handleKeyDown)
    store.socket.off('output', outputListener)
    window.removeEventListener('resize', handleResize)
    store.xtermInstances.delete(props.id)
    term.dispose()
  })
})

const handleResize = () => {
  if (fitAddon && props.isActive && terminalContainer.value) {
    fitAddon.fit()
    store.socket.emit('resize', { id: props.id, cols: term.cols, rows: term.rows })
  }
}

watch(() => props.isActive, (active) => {
  if (active) {
    nextTick(() => {
      handleResize()
      term.focus()
    })
  }
})
</script>

<style scoped>
.terminal-wrapper {
  transition: all 0.3s ease;
  background: rgba(15, 17, 21, 0.4);
}

.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

:deep(.xterm-helper-textarea) {
  position: absolute !important;
  opacity: 0 !important;
  z-index: -1 !important;
}
</style>
