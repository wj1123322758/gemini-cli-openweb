import { CONFIG } from '../config/index.js';
import pty from 'node-pty';

export class TerminalService {
  constructor() {
    this.terminals = new Map();
    this.logs = new Map();
    this.cwdMap = new Map();
  }

  create(id, cols, rows, cwd) {
    if (this.terminals.has(id)) {
      return { existing: true, cwd: this.cwdMap.get(id) };
    }

    const { SHELL, DEFAULT_COLS, DEFAULT_ROWS } = CONFIG.TERMINAL;
    let args = [];

    if (process.platform === 'win32') {
      const magicPrompt = `function prompt { $p = $pwd.Path; $e = [char]27; Write-Host -NoNewline \"$e]9;9;$p$e\\\"; return \"PS $p> \" }`;
      args = ['-NoLogo', '-ExecutionPolicy', 'Bypass', '-NoExit', '-Command', magicPrompt];
    }

    const ptyProcess = pty.spawn(SHELL, args, {
      name: 'xterm-color',
      cols: cols || DEFAULT_COLS,
      rows: rows || DEFAULT_ROWS,
      cwd,
      env: process.env
    });

    this.terminals.set(id, ptyProcess);
    this.logs.set(id, '');

    return { existing: false, process: ptyProcess };
  }

  get(id) {
    return this.terminals.get(id);
  }

  getLog(id) {
    return this.logs.get(id) || '';
  }

  getCwd(id) {
    return this.cwdMap.get(id);
  }

  write(id, data) {
    const term = this.terminals.get(id);
    if (term?.write) {
      try {
        term.write(data);
      } catch (e) {
        console.error('[TERMINAL] Write error:', e);
      }
    }
  }

  resize(id, cols, rows) {
    const term = this.terminals.get(id);
    if (term?.resize) {
      try {
        term.resize(cols, rows);
      } catch (e) {
        console.error('[TERMINAL] Resize error:', e);
      }
    }
  }

  appendLog(id, data) {
    let log = this.logs.get(id) || '';
    log = (log + data).slice(-CONFIG.BACKUP.MAX_LOG_SIZE);
    this.logs.set(id, log);
    return log;
  }

  updateCwd(id, path) {
    this.cwdMap.set(id, path);
  }

  kill(id) {
    const term = this.terminals.get(id);
    if (term) {
      term.kill();
      this.terminals.delete(id);
      this.logs.delete(id);
      this.cwdMap.delete(id);
    }
  }

  setupDataHandler(id, ptyProcess, onData, onExit) {
    ptyProcess.onData((data) => {
      const oscRegex = /\x1b]9;9;(.*?)\x1b\\/;
      const match = data.match(oscRegex);
      let outputData = data;

      if (match) {
        const newPath = match[1];
        this.updateCwd(id, newPath);
        outputData = data.replace(oscRegex, '');
      }

      this.appendLog(id, outputData);
      onData(outputData);
    });

    ptyProcess.onExit(() => {
      this.terminals.delete(id);
      this.logs.delete(id);
      this.cwdMap.delete(id);
      onExit();
    });
  }
}
