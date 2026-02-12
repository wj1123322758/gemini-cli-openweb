import path from 'path';
import { CONFIG } from '../config/index.js';

export function createPathResolver(basePath) {
  return {
    getTodoPath: () => path.join(basePath, CONFIG.PATHS.TODO_FILE),
    getTodoImagesDir: () => path.join(basePath, CONFIG.PATHS.TODO_IMAGES_DIR),
    getTodoBackupDir: () => path.join(basePath, CONFIG.PATHS.TODO_BACKUP_DIR),
    getImagePath: (filename) => path.join(basePath, CONFIG.PATHS.TODO_IMAGES_DIR, filename),
    getCheckpointDir: (hash) => path.join(CONFIG.PATHS.GEMINI_TMP, hash),
  };
}
