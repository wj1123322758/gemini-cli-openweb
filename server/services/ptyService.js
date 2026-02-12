import pty from 'node-pty';

export class PtyService {
    constructor(io) {
        this.io = io;
        this.terminals = new Map();
        this.terminalLogs = new Map();
        this.terminalCwds = new Map();
    }

    createTerminal(id, options) {
        const { cols, rows, cwd } = options;
        const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
        let args = [];
        
        if (process.platform === 'win32') {
            // 更加稳健的 Magic Prompt，显式发送 ST (String Terminator)
            const magicPrompt = `function prompt { $p = $pwd.Path; $e = [char]27; Write-Host -NoNewline \"$e]9;9;$p$e\\\"; return \"PS $p> \" }`;
            args = ['-NoLogo', '-ExecutionPolicy', 'Bypass', '-NoExit', '-Command', magicPrompt];
        }

        const ptyProcess = pty.spawn(shell, args, {
            name: 'xterm-color',
            cols: cols || 80,
            rows: rows || 24,
            cwd: cwd,
            env: process.env
        });

        this.terminals.set(id, ptyProcess);
        this.terminalLogs.set(id, "");

        ptyProcess.onData((data) => {
            // 兼容多种 ST 结尾 (ESC \ 或 BEL)
            const oscRegex = /\x1b]9;9;(.*?)(?:\x1b\\|\x07)/;
            const match = data.match(oscRegex);
            let outputData = data;
            
            if (match) {
                const newPath = match[1].trim();
                this.terminalCwds.set(id, newPath);
                // 广播给所有人，确保所有窗口同步路径
                this.io.emit('terminal-cwd', { id, path: newPath });
                outputData = data.replace(oscRegex, '');
            }
            
            let log = this.terminalLogs.get(id) || "";
            log = (log + outputData).slice(-15000);
            this.terminalLogs.set(id, log);
            this.io.to(id).emit('output', { id, data: outputData });
        });

        ptyProcess.onExit(() => {
            this.terminals.delete(id);
            this.terminalLogs.delete(id);
            this.terminalCwds.delete(id);
            this.io.to(id).emit('terminal-exit', id);
        });

        return ptyProcess;
    }

    write(id, data) {
        const term = this.terminals.get(id);
        if (term) term.write(data);
    }

    resize(id, cols, rows) {
        const term = this.terminals.get(id);
        if (term) term.resize(cols, rows);
    }

    kill(id) {
        const term = this.terminals.get(id);
        if (term) {
            term.kill();
            this.terminals.delete(id);
        }
    }

    getLog(id) {
        return this.terminalLogs.get(id);
    }

    getCwd(id) {
        return this.terminalCwds.get(id);
    }
}
