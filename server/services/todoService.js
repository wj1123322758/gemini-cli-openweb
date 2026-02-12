import fs from 'fs';
import path from 'path';

export class TodoService {
    constructor(projectRoot) {
        this.projectRoot = projectRoot;
    }

    getTodoPath(projectPath) { return path.join(projectPath, 'gemini-todo.json'); }
    getTodoImagesDir(projectPath) { return path.join(projectPath, 'todo-images'); }
    getTodoBackupDir(projectPath) { return path.join(projectPath, 'todo-backups'); }

    readTodos(projectPath) {
        const todoPath = this.getTodoPath(projectPath);
        if (!fs.existsSync(todoPath)) return [];
        try {
            return JSON.parse(fs.readFileSync(todoPath, 'utf8'));
        } catch (e) {
            return [];
        }
    }

    writeTodos(projectPath, todos) {
        const todoPath = this.getTodoPath(projectPath);
        fs.writeFileSync(todoPath, JSON.stringify(todos, null, 2), 'utf8');
        
        // Backup
        try {
            const backupDir = this.getTodoBackupDir(projectPath);
            if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            fs.writeFileSync(path.join(backupDir, `todo-backup-${timestamp}.json`), JSON.stringify(todos, null, 2));
        } catch (e) {
            console.error('[TODO] Backup failed:', e);
        }
    }

    saveImage(projectPath, base64) {
        const imgDir = this.getTodoImagesDir(projectPath);
        if (!fs.existsSync(imgDir)) fs.mkdirSync(imgDir, { recursive: true });
        
        const filename = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`;
        const filePath = path.join(imgDir, filename);
        const buffer = Buffer.from(base64.split(',')[1], 'base64');
        
        fs.writeFileSync(filePath, buffer);
        return `/todo-images/${filename}`;
    }
}
