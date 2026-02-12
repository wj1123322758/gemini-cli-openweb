import { useTerminalStore } from './terminalStore.js';
import { useProjectStore } from './projectStore.js';
import { useCheckpointStore } from './checkpointStore.js';
import { useTodoStore } from './todoStore.js';

// Export individual stores
export {
  useTerminalStore,
  useProjectStore,
  useCheckpointStore,
  useTodoStore,
};

// Composable for using all stores together
export function useAppStores() {
  return {
    terminal: useTerminalStore(),
    project: useProjectStore(),
    checkpoint: useCheckpointStore(),
    todo: useTodoStore(),
  };
}
