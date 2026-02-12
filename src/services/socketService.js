import { io } from 'socket.io-client';
import { CONFIG } from '../config/index.js';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect() {
    if (!this.socket) {
      this.socket = io(CONFIG.SOCKET_URL);
      this._setupDefaultListeners();
    }
    return this.socket;
  }

  _setupDefaultListeners() {
    this.socket.on('connect', () => {
      console.log('[SOCKET] Connected');
    });

    this.socket.on('disconnect', () => {
      console.log('[SOCKET] Disconnected');
    });
  }

  on(event, callback) {
    if (!this.socket) this.connect();
    this.socket.on(event, callback);
    
    // Track listeners for cleanup
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data, callback) {
    if (!this.socket) this.connect();
    this.socket.emit(event, data, callback);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
    }
  }
}

export const socketService = new SocketService();
