import { getPossibleHashes, normalizePath } from '../utils/pathHelper.js';
import os from 'os';

export function registerHandlers(io, ptyService, todoService, checkpointService) {
    // 核心改进：初始路径设为用户家目录，防止误改源码
    let currentProjectPath = os.homedir();

    const broadcastProjectState = (path) => {
        const hashes = getPossibleHashes(path);
        const checkpoints = checkpointService.getCheckpoints(path);
        const resumes = checkpointService.getResumes(path);
        const todos = todoService.readTodos(path);
        
        io.emit('project-info', { path, hashes });
        io.emit('checkpoint-list', checkpoints);
        io.emit('resume-list', resumes);
        io.emit('todo-list', todos);
    };

    io.on('connection', (socket) => {
        // 初始连接同步
        const hashes = getPossibleHashes(currentProjectPath);
        socket.emit('project-info', { path: currentProjectPath, hashes });
        socket.emit('checkpoint-list', checkpointService.getCheckpoints(currentProjectPath));
        socket.emit('resume-list', checkpointService.getResumes(currentProjectPath));
        socket.emit('todo-list', todoService.readTodos(currentProjectPath));

        socket.on('get-checkpoints', () => {
            socket.emit('checkpoint-list', checkpointService.getCheckpoints(currentProjectPath));
        });

        socket.on('get-resumes', () => {
            socket.emit('resume-list', checkpointService.getResumes(currentProjectPath));
        });

        socket.on('get-todos', () => {
            socket.emit('todo-list', todoService.readTodos(currentProjectPath));
        });
        
        socket.on('update-todos', (todos) => {
            todoService.writeTodos(currentProjectPath, todos);
            io.emit('todo-list', todos);
        });

        socket.on('upload-todo-image', ({ base64 }, callback) => {
            try {
                const url = todoService.saveImage(currentProjectPath, base64);
                callback({ success: true, url });
            } catch (e) {
                callback({ success: false });
            }
        });

        socket.on('set-project-path', (newPath) => {
            const cleanPath = normalizePath(newPath);
            currentProjectPath = cleanPath;
            broadcastProjectState(cleanPath);
        });

        socket.on('create-terminal', ({ id, cols, rows }) => {
            socket.join(id);
            if (!ptyService.terminals.has(id)) {
                // 终端启动在当前选定的项目路径下
                ptyService.createTerminal(id, { cols, rows, cwd: currentProjectPath });
            } else {
                const log = ptyService.getLog(id);
                if (log) socket.emit('output', { id, data: log });
                const cwd = ptyService.getCwd(id);
                if (cwd) socket.emit('terminal-cwd', { id, path: cwd });
            }
        });

        socket.on('input', ({ id, data }) => ptyService.write(id, data));
        socket.on('resize', ({ id, cols, rows }) => ptyService.resize(id, cols, rows));
        socket.on('close-terminal', (id) => ptyService.kill(id));

        socket.on('delete-checkpoint', (tag) => {
            checkpointService.deleteCheckpoint(currentProjectPath, tag);
            broadcastProjectState(currentProjectPath);
        });

        socket.on('touch-session', ({ projectHash, sessionFileName }, callback) => {
            const result = checkpointService.touchSession(projectHash, sessionFileName);
            if (callback) callback(result);
        });
    });

    return {
        getCurrentPath: () => currentProjectPath
    };
}
