import fs from 'fs';
import path from 'path';

export function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  return dirPath;
}

export function readJsonFile(filePath, defaultValue = []) {
  if (!fs.existsSync(filePath)) return defaultValue;
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch {
    return defaultValue;
  }
}

export function writeJsonFile(filePath, data) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

export function saveWithBackup(filePath, data, backupDir) {
  writeJsonFile(filePath, data);
  
  try {
    ensureDir(backupDir);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `todo-backup-${timestamp}.json`);
    writeJsonFile(backupPath, data);
  } catch (e) {
    console.error('[BACKUP] Failed:', e);
  }
}
