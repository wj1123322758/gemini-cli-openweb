import { CheckpointService } from '../services/checkpointService.js';
import { TodoService } from '../services/todoService.js';
import { TerminalService } from '../services/terminalService.js';
import { getPossibleHashes } from '../utils/hash.js';
import fs from 'fs';

export class SocketHandler {
  constructor(io, initialProjectPath) {
    this.io = io;
    this.projectPath = initialProjectPath;
    this.projectHashes = getPossibleHashes(initialProjectPath);
    
    this.checkpointService = new CheckpointService(initialProjectPath);
    this.todoService = new TodoService(initialProjectPath);
    this.terminalService = new TerminalService();
  }

  handleConnection(socket) {
    this._emitInitialState(socket);
    this._setupEventHandlers(socket);
  }

  _emitInitialState(socket) {
    socket.emit('project-info', { 
      path: this.projectPath, 
      hashes: this.projectHashes 
    });
    socket.emit('checkpoint-list', this.checkpointService.getAll());
    socket.emit('todo-list', this.todoService.getAll());
  }

  _setupEventHandlers(socket) {
    // Checkpoints
    socket.on('get-checkpoints', () => {
      socket.emit('checkpoint-list', this.checkpointService.getAll());
    });

    socket.on('delete-checkpoint', (tag) => {
      this.checkpointService.delete(tag);
      this.io.emit('checkpoint-list', this.checkpointService.getAll());
    });

    // Todos
    socket.on('get-todos', () => {
      socket.emit('todo-list', this.todoService.getAll());
    });

    socket.on('update-todos', (todos) => {
      this.todoService.save(todos);
      this.io.emit('todo-list', todos);
    });

    socket.on('upload-todo-image', async ({ base64 }, callback) => {
      try {
        const result = await this.todoService.uploadImage(base64);
        callback({ success: true, url: result.url });
      } catch (e) {
        console.error('[IMAGE] Upload error:', e);
        callback({ success: false });
      }
    });

    // Project Path
    socket.on('set-project-path', (newPath) => {
      this._handlePathChange(socket, newPath);
    });

    // Terminal
    socket.on('create-terminal', ({ id, cols, rows }) => {
      this._handleCreateTerminal(socket, id, cols, rows);
    });

    socket.on('input', ({ id, data }) => {
      this.terminalService.write(id, data);
    });

    socket.on('resize', ({ id, cols, rows }) => {
      this.terminalService.resize(id, cols, rows);
    });

    socket.on('close-terminal', (id) => {
      this.terminalService.kill(id);
    });
  }

  _handlePathChange(socket, newPath) {
    try {
      const cleanPath = newPath.replace(/[\\\/]\.gemini.*/, '');
      if (fs.existsSync(cleanPath) && fs.statSync(cleanPath).isDirectory()) {
        this.projectPath = cleanPath;
        this.projectHashes = getPossibleHashes(cleanPath);
        
        this.checkpointService.setProjectPath(cleanPath);
        this.todoService.setProjectPath(cleanPath);

        socket.emit('project-info', { 
          path: this.projectPath, 
          hashes: this.projectHashes 
        });
        socket.emit('checkpoint-list', this.checkpointService.getAll());
        socket.emit('todo-list', this.todoService.getAll());
      }
    } catch (e) {
      console.error('[PATH] Change error:', e);
    }
  }

  _handleCreateTerminal(socket, id, cols, rows) {
    socket.join(id);
    
    const result = this.terminalService.create(id, cols, rows, this.projectPath);
    
    if (result.existing) {
      // Restore existing terminal state
      const log = this.terminalService.getLog(id);
      const cwd = this.terminalService.getCwd(id);
      
      if (log) socket.emit('output', { id, data: log });
      if (cwd) socket.emit('terminal-cwd', { id, path: cwd });
    } else {
      // Setup new terminal
      this.terminalService.setupDataHandler(
        id,
        result.process,
        (data) => {
          this.io.to(id).emit('output', { id, data });
        },
        () => {
          this.io.to(id).emit('terminal-exit', id);
        }
      );
    }
  }
}
