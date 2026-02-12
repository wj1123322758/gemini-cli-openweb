import { getPossibleHashes, normalizePath } from '../utils/pathHelper.js';

export function registerHandlers(io, ptyService, todoService, checkpointService) {
    let currentProjectPath = process.cwd();

    const broadcastProjectState = (path) => {
        const hashes = getPossibleHashes(path);
        const checkpoints = checkpointService.getCheckpoints(path);
        const todos = todoService.readTodos(path);
        
        io.emit('project-info', { path, hashes });
        io.emit('checkpoint-list', checkpoints);
        io.emit('todo-list', todos);
    };

    io.on('connection', (socket) => {
        // Initial sync for new connection
        const hashes = getPossibleHashes(currentProjectPath);
        socket.emit('project-info', { path: currentProjectPath, hashes });
        socket.emit('checkpoint-list', checkpointService.getCheckpoints(currentProjectPath));
        socket.emit('todo-list', todoService.readTodos(currentProjectPath));

        socket.on('get-checkpoints', () => {
            socket.emit('checkpoint-list', checkpointService.getCheckpoints(currentProjectPath));
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
    });

    return {
        getCurrentPath: () => currentProjectPath
    };
}
