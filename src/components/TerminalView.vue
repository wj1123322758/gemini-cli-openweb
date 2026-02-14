<template>
  <div v-show="isActive" class="absolute inset-0 flex flex-col overflow-hidden terminal-wrapper z-20">
    <!-- Terminal Container -->
    <div ref="terminalContainer" class="flex-1 w-full overflow-hidden bg-black/20"></div>

    <!-- Shortcut Toolbar (Fixed at Bottom) -->
    <div class="flex items-center gap-1 p-1.5 bg-lab-surface/60 backdrop-blur-xl border-t border-lab-border overflow-x-auto no-scrollbar shrink-0 shadow-2xl">
      <div class="flex items-center gap-1 pr-2 border-r border-lab-border/30">
        <button v-for="cmd in basicCmds" :key="cmd.label" @click="sendCommand(cmd.value)" 
          class="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-lab-text-dim/80 hover:text-lab-primary hover:bg-lab-primary/10 rounded transition-all whitespace-nowrap"
          :title="cmd.title">
          {{ cmd.label }}
        </button>
      </div>
      
      <div class="flex items-center gap-1 px-2 border-r border-lab-border/30">
        <!-- Special handle for Archive -->
        <button @click="handleArchive" 
          class="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-lab-accent hover:bg-lab-accent/10 rounded transition-all whitespace-nowrap"
          title="快速存档当前会话">
          存档
        </button>
        <button v-for="cmd in sessionCmds" :key="cmd.label" @click="sendCommand(cmd.value)" 
          class="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-lab-text-dim/80 hover:text-lab-accent hover:bg-lab-accent/10 rounded transition-all whitespace-nowrap"
          :title="cmd.title">
          {{ cmd.label }}
        </button>
      </div>

      <div class="flex items-center gap-1 px-2 border-r border-lab-border/30">
        <button v-for="cmd in systemCmds" :key="cmd.label" @click="sendCommand(cmd.value)" 
          class="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-lab-text-dim/80 hover:text-yellow-500 hover:bg-yellow-500/10 rounded transition-all whitespace-nowrap"
          :title="cmd.title">
          {{ cmd.label }}
        </button>
      </div>

      <div class="flex items-center gap-1 pl-2">
        <button v-for="cmd in toolCmds" :key="cmd.label" @click="sendCommand(cmd.value)" 
          class="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-lab-text-dim/80 hover:text-green-500 hover:bg-green-500/10 rounded transition-all whitespace-nowrap"
          :title="cmd.title">
          {{ cmd.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue'
import { Terminal } from 'xterm'
import { FitAddon } from 'xterm-addon-fit'
import 'xterm/css/xterm.css'
import { useAppStore } from '../stores/app'
import { checkIsInGemini } from '../services/terminalLogic'
import { notificationService } from '../services/notificationService'

const props = defineProps(['id', 'isActive', 'initialCommand'])
const store = useAppStore()
const terminalContainer = ref(null)
let term = null
let fitAddon = null
let notificationDebounce = null

const basicCmds = [
  { label: '启动', value: 'gemini', title: '运行 Gemini CLI' },
  { label: 'Shell', value: '!', title: '切换 Shell 模式' },
  { label: '清屏', value: '/clear', title: '清空终端和上下文' },
  { label: '帮助', value: '/help', title: '显示帮助信息' },
]

const sessionCmds = [
  { label: '总结', value: '/compress', title: '压缩并总结当前上下文' },
  { label: '回退', value: '/rewind', title: '浏览并回退消息' },
  { label: '列表', value: '/chat list', title: '列出所有保存的会话' },
]

const systemCmds = [
  { label: '模型', value: '/model', title: '切换 AI 模型' },
  { label: '主题', value: '/theme', title: '切换界面主题' },
  { label: '登录', value: '/auth login', title: '账号登录与认证' },
  { label: 'Vim', value: '/vim', title: '开启/关闭 Vim 模式' },
]

const toolCmds = [
  { label: 'MCP', value: '/mcp list', title: '查看 MCP 服务器列表' },
  { label: '记忆', value: '/memory show', title: '显示当前 AI 记忆内容' },
  { label: 'YOLO', value: '\x19', title: '切换自动批准模式 (Ctrl+Y)' },
]

const sendCommand = (cmd) => {
  // Shell 和 YOLO 逻辑：无前置，无回车，直接发送
  if (cmd === '!' || cmd === '\x19') {
    store.socket.emit('input', { id: props.id, data: cmd })
    term.focus()
    return
  }

  // 区分前置字符：只有启动 (gemini) 用 Ctrl+C, 其余用 Ctrl+U
  const prefix = (cmd === 'gemini') ? '\x03' : '\x15'
  store.socket.emit('input', { id: props.id, data: prefix })
  
  setTimeout(() => {
    store.socket.emit('input', { id: props.id, data: cmd })
    setTimeout(() => {
      store.socket.emit('input', { id: props.id, data: '\r' })
    }, 1000)
  }, 200)
  
  term.focus()
}

const handleArchive = () => {
  const tag = prompt("请输入存档标签:");
  if (tag && tag.trim()) {
    const fullCmd = `/chat save ${tag.trim()}`
    // 存档属于普通指令，使用 Ctrl+U 前置
    store.socket.emit('input', { id: props.id, data: '\x15' })
    
    setTimeout(() => {
      store.socket.emit('input', { id: props.id, data: fullCmd })
      setTimeout(() => {
        store.socket.emit('input', { id: props.id, data: '\r' })
      }, 1000)
    }, 200)
    
    term.focus()
  }
}

const handleKeyDown = (e) => {
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
      return false
    }
    return true
  })

  const outputListener = ({ id, data }) => {
    if (id === props.id) {
      term.write(data)
      
      // Notification logic: check if waiting for input
      clearTimeout(notificationDebounce)
      notificationDebounce = setTimeout(() => {
        if (checkIsInGemini(term)) {
          notificationService.notify('Gemini 等待操作', {
            body: '终端已就绪，请继续指令',
            requireBlur: true, // Only notify if window is not focused
            tag: 'terminal-waiting-' + props.id,
            renotify: false
          })
        }
      }, 1500) // 1.5s delay after last output to ensure it's actually waiting
    }
  }
  store.socket.on('output', outputListener)

  store.socket.emit('create-terminal', { id: props.id, cols: term.cols, rows: term.rows })

  if (props.initialCommand) {
    setTimeout(() => {
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
    clearTimeout(notificationDebounce)
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
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
:deep(.xterm-helper-textarea) { position: absolute !important; opacity: 0 !important; z-index: -1 !important; }
</style>
