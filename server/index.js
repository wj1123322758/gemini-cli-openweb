import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { PtyService } from './services/ptyService.js';
import { TodoService } from './services/todoService.js';
import { CheckpointService } from './services/checkpointService.js';
import { registerHandlers } from './socket/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const server = createServer(app);
const io = new Server(server, { 
    cors: { origin: "*" },
    maxHttpBufferSize: 1e8 
});

// Services
const ptyService = new PtyService(io);
const todoService = new TodoService();
const checkpointService = new CheckpointService();

// Register Socket Handlers
const socketManager = registerHandlers(io, ptyService, todoService, checkpointService);

// Middleware
app.use(express.static(path.join(__dirname, '../dist')));

// Image Serving (核心修复：支持动态项目路径下的图片读取)
app.get('/todo-images/:filename', (req, res) => {
    const filename = req.params.filename;
    const currentPath = socketManager.getCurrentPath();
    const filePath = path.join(currentPath, 'todo-images', filename);
    
    if (fs.existsSync(filePath)) {
        return res.sendFile(path.resolve(filePath));
    }
    console.warn(`[IMAGE] 404: ${filePath}`);
    res.status(404).send('Image not found');
});

const PORT = 3001;
server.listen(PORT, () => console.log(`Server ready at http://localhost:${PORT}`));

process.on('uncaughtException', (err) => console.error('CRITICAL:', err));
process.on('unhandledRejection', (reason) => console.error('CRITICAL:', reason));
