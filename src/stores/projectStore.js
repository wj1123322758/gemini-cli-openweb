import { defineStore } from 'pinia';
import { ref } from 'vue';
import { socketService } from '../services/socketService.js';
import { CONFIG } from '../config/index.js';

export const useProjectStore = defineStore('project', () => {
  // State
  const projectPath = ref(localStorage.getItem(CONFIG.STORAGE_KEYS.PROJECT_PATH) || '');
  const projectHashes = ref([]);

  // Actions
  function setProjectPath(newPath) {
    if (newPath) {
      projectPath.value = newPath;
      localStorage.setItem(CONFIG.STORAGE_KEYS.PROJECT_PATH, newPath);
      socketService.emit('set-project-path', newPath.trim());
    }
  }

  function updateFromServer({ path, hashes }) {
    projectPath.value = path;
    if (hashes) projectHashes.value = hashes;
    localStorage.setItem(CONFIG.STORAGE_KEYS.PROJECT_PATH, path);
  }

  // Socket event handlers
  socketService.on('project-info', (data) => {
    updateFromServer(data);
  });

  return {
    projectPath,
    projectHashes,
    setProjectPath,
    updateFromServer,
  };
});
