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
const PROJECT_ROOT = path.resolve(__dirname, '..');
const app = express();
const server = createServer(app);
const io = new Server(server, { 
    cors: { origin: "*" },
    maxHttpBufferSize: 1e8 // 100MB
});

app.use(express.static(path.join(__dirname, '../dist')));

// --- 核心工具：多变体 Hash 计算 ---
function getPossibleHashes(projectPath) {
    const p = path.resolve(projectPath);
    const variants = [p, p.toLowerCase(), p.replace(/\\/g, '/'), p.toLowerCase().replace(/\\/g, '/')];
    return [...new Set(variants)].map(v => crypto.createHash('sha256').update(v).digest('hex'));
}

let currentProjectPath = process.cwd();
let currentProjectHashes = getPossibleHashes(currentProjectPath);

// --- 纯净版图片分发逻辑 (仅搜索当前项目根目录) ---
app.get('/todo-images/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(currentProjectPath, 'todo-images', filename);
    
    if (fs.existsSync(filePath)) {
        return res.sendFile(path.resolve(filePath));
    }
    
    console.warn(`[IMAGE] Not found on disk: ${filePath}`);
    res.status(404).send('Image not found');
});

// --- 路径管理逻辑 (纯项目根目录模式) ---
function getTodoPath() { return path.join(currentProjectPath, 'gemini-todo.json'); }
function getTodoImagesDir() { return path.join(currentProjectPath, 'todo-images'); }
function getTodoBackupDir() { return path.join(currentProjectPath, 'todo-backups'); }

// --- Checkpoint 解析逻辑 ---
function getCheckpoints(callback) {
    const tmpBase = path.join(os.homedir(), '.gemini', 'tmp');
    if (!fs.existsSync(tmpBase)) return callback([]);
    let allSessions = [];
    const targetHashes = getPossibleHashes(currentProjectPath);
    targetHashes.forEach(hash => {
        const projectDir = path.join(tmpBase, hash);
        if (fs.existsSync(projectDir)) {
            try {
                const files = fs.readdirSync(projectDir);
                const sessions = files.filter(f => f.startsWith('checkpoint-') && f.endsWith('.json')).map(f => {
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
                }).filter(s => s !== null);
                allSessions = allSessions.concat(sessions);
            } catch (e) {}
        }
    });
    const uniqueSessions = [];
    const seenTags = new Set();
    allSessions.sort((a, b) => b.rawTime - a.rawTime).forEach(s => {
        if (!seenTags.has(s.tag)) { seenTags.add(s.tag); uniqueSessions.push(s); }
    });
    callback(uniqueSessions);
}

function readTodos(callback) {
    const todoPath = getTodoPath();
    if (!fs.existsSync(todoPath)) return callback([]);
    fs.readFile(todoPath, 'utf8', (err, data) => {
        if (err) return callback([]);
        try { callback(JSON.parse(data)); } catch (e) { callback([]); }
    });
}

function writeTodos(todos, callback) {
    const todoPath = getTodoPath();
    fs.writeFile(todoPath, JSON.stringify(todos, null, 2), 'utf8', (err) => {
        if (!err) {
            console.log(`[TODO] Saved items to ${todoPath}`);
            try {
                const backupDir = getTodoBackupDir();
                if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                fs.writeFileSync(path.join(backupDir, `todo-backup-${timestamp}.json`), JSON.stringify(todos, null, 2));
            } catch (e) {}
        }
        if (callback) callback(err);
    });
}

const terminals = new Map();
const terminalLogs = new Map();
const terminalCwds = new Map();

io.on('connection', (socket) => {
    socket.emit('project-info', { path: currentProjectPath, hashes: currentProjectHashes });
    getCheckpoints((tags) => socket.emit('checkpoint-list', tags));
    readTodos((todos) => socket.emit('todo-list', todos));
    socket.on('get-checkpoints', () => getCheckpoints((tags) => socket.emit('checkpoint-list', tags)));
    socket.on('get-todos', () => readTodos((todos) => socket.emit('todo-list', todos)));
    socket.on('update-todos', (todos) => { writeTodos(todos, (err) => { if (!err) io.emit('todo-list', todos); }); });
    socket.on('upload-todo-image', ({ base64 }, callback) => {
        try {
            const imgDir = getTodoImagesDir();
            if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });
            const filename = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`;
            const filePath = path.join(imgDir, filename);
            const buffer = Buffer.from(base64.split(',')[1], 'base64');
            
            console.log(`[IMAGE] Uploading to: ${filePath}`);
            
            fs.writeFile(filePath, buffer, (err) => {
                if (err) {
                    console.error('[IMAGE] Write error:', err);
                    callback({ success: false });
                } else {
                    console.log(`[IMAGE] Successfully saved: ${filename}`);
                    callback({ success: true, url: `/todo-images/${filename}` });
                }
            });
        } catch (e) { 
            console.error('[IMAGE] Processing crash:', e);
            callback({ success: false }); 
        }
    });
    socket.on('set-project-path', (newPath) => {
        try {
            const cleanPath = newPath.replace(/[\\\/]\.gemini.*/, '');
            if (fs.existsSync(cleanPath) && fs.statSync(cleanPath).isDirectory()) {
                currentProjectPath = cleanPath;
                currentProjectHashes = getPossibleHashes(cleanPath);
                socket.emit('project-info', { path: currentProjectPath, hashes: currentProjectHashes });
                getCheckpoints((tags) => socket.emit('checkpoint-list', tags));
                readTodos((todos) => socket.emit('todo-list', todos));
            }
        } catch (e) {}
    });
    socket.on('create-terminal', ({ id, cols, rows }) => {
        socket.join(id);
        if (!terminals.has(id)) {
            const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
            let args = [];
            if (process.platform === 'win32') {
                const magicPrompt = `function prompt { $p = $pwd.Path; $e = [char]27; Write-Host -NoNewline \"$e]9;9;$p$e\\\"; return \"PS $p> \" }`;
                args = ['-NoLogo', '-ExecutionPolicy', 'Bypass', '-NoExit', '-Command', magicPrompt];
            }
            const ptyProcess = pty.spawn(shell, args, { name: 'xterm-color', cols: cols || 80, rows: rows || 24, cwd: currentProjectPath, env: process.env });
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
            ptyProcess.onExit(() => { terminals.delete(id); terminalLogs.delete(id); terminalCwds.delete(id); io.to(id).emit('terminal-exit', id); });
        } else {
            if (terminalLogs.has(id)) socket.emit('output', { id, data: terminalLogs.get(id) });
            const cwd = terminalCwds.get(id);
            if (cwd) socket.emit('terminal-cwd', { id, path: cwd });
        }
    });
    socket.on('input', ({ id, data }) => {
        const term = terminals.get(id);
        if (term && term.write) { try { term.write(data); } catch (e) {} }
    });
    socket.on('resize', ({ id, cols, rows }) => {
        const term = terminals.get(id);
        if (term && term.resize) { try { term.resize(cols, rows); } catch (e) {} }
    });
    socket.on('delete-checkpoint', (tag) => {
        const tmpBase = path.join(os.homedir(), '.gemini', 'tmp');
        getPossibleHashes(currentProjectPath).forEach(hash => {
            const filePath = path.join(tmpBase, hash, `checkpoint-${encodeURIComponent(tag)}.json`);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        });
        getCheckpoints((tags) => io.emit('checkpoint-list', tags));
    });
    socket.on('close-terminal', (id) => {
        const term = terminals.get(id);
        if (term) { term.kill(); terminals.delete(id); }
    });
});

const PORT = 3001;
server.listen(PORT, () => console.log(`Server ready at http://localhost:${PORT}`));
process.on('uncaughtException', (err) => console.error('CRITICAL:', err));
process.on('unhandledRejection', (reason) => console.error('CRITICAL:', reason));
