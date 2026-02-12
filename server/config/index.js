import path from 'path';
import os from 'os';

export const CONFIG = {
  PORT: 3001,
  HOST: 'localhost',
  CORS_ORIGIN: '*',
  MAX_HTTP_BUFFER_SIZE: 1e8, // 100MB
  
  PATHS: {
    GEMINI_TMP: path.join(os.homedir(), '.gemini', 'tmp'),
    TODO_FILE: 'gemini-todo.json',
    TODO_IMAGES_DIR: 'todo-images',
    TODO_BACKUP_DIR: 'todo-backups',
  },
  
  TERMINAL: {
    SHELL: process.platform === 'win32' ? 'powershell.exe' : 'bash',
    DEFAULT_COLS: 80,
    DEFAULT_ROWS: 24,
  },
  
  BACKUP: {
    MAX_LOG_SIZE: 15000,
  }
};
