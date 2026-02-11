import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import pty from 'node-pty';
import path from 'path';
import fs from 'fs';
import os from 'os';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

app.use(express.static(path.join(__dirname, '../dist')));

// --- 完全保留原版 Hash 算法 ---
function getProjectHash(projectPath) {
    return crypto.createHash('sha256').update(path.resolve(projectPath)).digest('hex');
}

let currentProjectPath = process.cwd();
let currentProjectHash = getProjectHash(currentProjectPath);

// --- 完全保留原版 Checkpoint 解析逻辑 ---
function getCheckpoints(callback) {
    const projectDir = path.join(os.homedir(), '.gemini', 'tmp', currentProjectHash);
    if (!fs.existsSync(projectDir)) return callback([]);
    fs.readdir(projectDir, (err, files) => {
        if (err) return callback([]);
        const sessions = files
            .filter(f => f.startsWith('checkpoint-') && f.endsWith('.json'))
            .map(f => {
                try {
                    const filePath = path.join(projectDir, f);
                    const tag = decodeURIComponent(f).replace('checkpoint-', '').replace('.json', '').trim();
                    const stats = fs.statSync(filePath);
                    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    const history = content.history || [];
                    const preview = history.filter(m => m.role === 'user').map(m => {
                        if (m.parts && m.parts[0] && m.parts[0].text) return m.parts[0].text.substring(0, 200).replace(/\n/g, ' ').trim();
                        return '';
                    }).filter(t => t.length > 0);
                    return { tag, name: tag, time: new Date(stats.mtime).toLocaleString(), preview, rawTime: stats.mtime.getTime() };
                } catch (e) { return null; }
            })
            .filter(s => s !== null)
            .sort((a, b) => b.rawTime - a.rawTime);
        callback(sessions);
    });
}

// --- 完全保留原版持久化状态 ---
const terminals = new Map();
const terminalLogs = new Map();
const terminalCwds = new Map();

io.on('connection', (socket) => {
    socket.emit('project-info', { path: currentProjectPath, hash: currentProjectHash });
    getCheckpoints((tags) => socket.emit('checkpoint-list', tags));

    socket.on('get-checkpoints', () => {
         getCheckpoints((tags) => socket.emit('checkpoint-list', tags));
    });

    socket.on('set-project-path', (newPath) => {
        try {
            if (fs.existsSync(newPath) && fs.statSync(newPath).isDirectory()) {
                currentProjectPath = newPath;
                currentProjectHash = getProjectHash(newPath);
                socket.emit('project-info', { path: currentProjectPath, hash: currentProjectHash });
                getCheckpoints((tags) => socket.emit('checkpoint-list', tags));
            }
        } catch (e) {}
    });

    socket.on('create-terminal', ({ id, cols, rows }) => {
        socket.join(id);
        
        if (!terminals.has(id)) {
            const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
            let args = [];
            
            // --- 还原 Magic Prompt 注入 ---
            if (process.platform === 'win32') {
                const magicPrompt = `function prompt { $p = $pwd.Path; $e = [char]27; Write-Host -NoNewline \"$e]9;9;$p$e\\\"; return \"PS $p> \" }`;
                args = ['-NoLogo', '-ExecutionPolicy', 'Bypass', '-NoExit', '-Command', magicPrompt];
            }

            const ptyProcess = pty.spawn(shell, args, {
                name: 'xterm-color', cols: cols || 80, rows: rows || 24,
                cwd: currentProjectPath, env: process.env
            });

            terminals.set(id, ptyProcess);
            terminalLogs.set(id, "");

            ptyProcess.onData((data) => {
                const oscRegex = /\x1b]9;9;(.*?)\x1b\\/;
                const match = data.match(oscRegex);
                let outputData = data;

                if (match) {
                    const newPath = match[1];
                    terminalCwds.set(id, newPath);
                    io.to(id).emit('terminal-cwd', { id, path: newPath });
                    outputData = data.replace(oscRegex, '');
                }

                let log = terminalLogs.get(id) || "";
                log = (log + outputData).slice(-15000);
                terminalLogs.set(id, log);
                io.to(id).emit('output', { id, data: outputData });
            });
            
            ptyProcess.onExit(() => {
                terminals.delete(id);
                terminalLogs.delete(id);
                terminalCwds.delete(id);
                io.to(id).emit('terminal-exit', id);
            });
        } else {
            // --- 还原日志回显 ---
            if (terminalLogs.has(id)) {
                socket.emit('output', { id, data: terminalLogs.get(id) });
            }
            const cwd = terminalCwds.get(id);
            if (cwd) socket.emit('terminal-cwd', { id, path: cwd });
        }
    });

    socket.on('input', ({ id, data }) => {
        const term = terminals.get(id);
        if (term && term.write) {
            try {
                term.write(data);
            } catch (e) {
                console.error(`Error writing to terminal ${id}:`, e);
            }
        }
    });

    socket.on('resize', ({ id, cols, rows }) => {
        const term = terminals.get(id);
        if (term && term.resize) {
            try {
                term.resize(cols, rows);
            } catch (e) {}
        }
    });
    
    socket.on('delete-checkpoint', (tag) => {
        const projectDir = path.join(os.homedir(), '.gemini', 'tmp', currentProjectHash);
        const filename = `checkpoint-${encodeURIComponent(tag)}.json`;
        const filePath = path.join(projectDir, filename);
        
        if (fs.existsSync(filePath)) {
            fs.unlink(filePath, (err) => {
                if (!err) {
                    console.log(`Deleted checkpoint: ${tag}`);
                    getCheckpoints((tags) => io.emit('checkpoint-list', tags));
                }
            });
        }
    });
    socket.on('close-terminal', (id) => {
        const term = terminals.get(id);
        if (term) { term.kill(); terminals.delete(id); terminalLogs.delete(id); }
    });
});

const PORT = 3001;
server.listen(PORT, () => console.log(`Server sync-ready at http://localhost:${PORT}`));

// --- 进程保护：防止意外崩溃导致服务中断 ---
process.on('uncaughtException', (err) => {
    console.error('CRITICAL: Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
});
