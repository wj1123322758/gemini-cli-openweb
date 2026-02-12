import path from 'path';
import { createPathResolver } from '../utils/paths.js';
import { readJsonFile, saveWithBackup } from '../utils/file.js';

export class TodoService {
  constructor(projectPath) {
    this.setProjectPath(projectPath);
  }

  setProjectPath(projectPath) {
    this.projectPath = projectPath;
    this.paths = createPathResolver(projectPath);
  }

  getAll() {
    return readJsonFile(this.paths.getTodoPath(), []);
  }

  save(todos) {
    const todoPath = this.paths.getTodoPath();
    const backupDir = this.paths.getTodoBackupDir();
    saveWithBackup(todoPath, todos, backupDir);
    return todos;
  }

  async uploadImage(base64Data) {
    const imgDir = this.paths.getTodoImagesDir();
    const filename = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`;
    const filePath = path.join(imgDir, filename);
    
    const { writeFile, ensureDir } = await import('../utils/file.js');
    ensureDir(imgDir);
    
    const buffer = Buffer.from(base64Data.split(',')[1], 'base64');
    
    return new Promise((resolve, reject) => {
      import('fs').then(fs => {
        fs.writeFile(filePath, buffer, (err) => {
          if (err) reject(err);
          else resolve({ filename, url: `/todo-images/${filename}` });
        });
      });
    });
  }

  getImagePath(filename) {
    return this.paths.getImagePath(filename);
  }
}
