import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { CONFIG } from './config/index.js';
import { createRoutes } from './routes/index.js';
import { SocketHandler } from './handlers/socketHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

class GeminiServer {
  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.io = new Server(this.server, {
      cors: { origin: CONFIG.CORS_ORIGIN },
      maxHttpBufferSize: CONFIG.MAX_HTTP_BUFFER_SIZE
    });
    
    this.currentProjectPath = process.cwd();
    
    this._setupMiddleware();
    this._setupRoutes();
    this._setupSocketHandlers();
  }

  _setupMiddleware() {
    // Add any global middleware here
  }

  _setupRoutes() {
    const routes = createRoutes(
      path.join(__dirname, '../dist'),
      () => this.currentProjectPath
    );
    this.app.use(routes);
  }

  _setupSocketHandlers() {
    const socketHandler = new SocketHandler(this.io, this.currentProjectPath);
    
    // Update currentProjectPath reference when it changes
    socketHandler.onPathChange = (newPath) => {
      this.currentProjectPath = newPath;
    };

    this.io.on('connection', (socket) => {
      socketHandler.handleConnection(socket);
    });
  }

  start() {
    this.server.listen(CONFIG.PORT, () => {
      console.log(`Server ready at http://${CONFIG.HOST}:${CONFIG.PORT}`);
    });

    this._setupErrorHandlers();
  }

  _setupErrorHandlers() {
    process.on('uncaughtException', (err) => {
      console.error('CRITICAL:', err);
    });
    
    process.on('unhandledRejection', (reason) => {
      console.error('CRITICAL:', reason);
    });
  }
}

// Start server
const server = new GeminiServer();
server.start();
