import fs from 'fs';
import path from 'path';
import { CONFIG } from '../config/index.js';
import { getPossibleHashes } from '../utils/hash.js';

export class CheckpointService {
  constructor(projectPath) {
    this.projectPath = projectPath;
  }

  setProjectPath(projectPath) {
    this.projectPath = projectPath;
  }

  getAll() {
    const tmpBase = CONFIG.PATHS.GEMINI_TMP;
    if (!fs.existsSync(tmpBase)) return [];

    const allSessions = [];
    const targetHashes = getPossibleHashes(this.projectPath);

    for (const hash of targetHashes) {
      const projectDir = path.join(tmpBase, hash);
      if (!fs.existsSync(projectDir)) continue;

      try {
        const files = fs.readdirSync(projectDir);
        const sessions = files
          .filter(f => f.startsWith('checkpoint-') && f.endsWith('.json'))
          .map(f => this._parseCheckpointFile(projectDir, f))
          .filter(s => s !== null);
        
        allSessions.push(...sessions);
      } catch (e) {
        console.error('[CHECKPOINT] Error reading dir:', e);
      }
    }

    return this._deduplicateAndSort(allSessions);
  }

  _parseCheckpointFile(projectDir, filename) {
    try {
      const filePath = path.join(projectDir, filename);
      const tag = decodeURIComponent(filename)
        .replace('checkpoint-', '')
        .replace('.json', '')
        .trim();
      const stats = fs.statSync(filePath);
      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const history = content.history || [];
      
      const preview = history
        .filter(m => m.role === 'user')
        .map(m => {
          if (m.parts?.[0]?.text) {
            return m.parts[0].text.substring(0, 200).replace(/\n/g, ' ').trim();
          }
          return '';
        })
        .filter(t => t.length > 0);

      return {
        tag,
        name: tag,
        time: new Date(stats.mtime).toLocaleString(),
        preview,
        rawTime: stats.mtime.getTime()
      };
    } catch (e) {
      return null;
    }
  }

  _deduplicateAndSort(sessions) {
    const uniqueSessions = [];
    const seenTags = new Set();
    
    sessions
      .sort((a, b) => b.rawTime - a.rawTime)
      .forEach(s => {
        if (!seenTags.has(s.tag)) {
          seenTags.add(s.tag);
          uniqueSessions.push(s);
        }
      });
    
    return uniqueSessions;
  }

  delete(tag) {
    const tmpBase = CONFIG.PATHS.GEMINI_TMP;
    const hashes = getPossibleHashes(this.projectPath);
    
    for (const hash of hashes) {
      const filePath = path.join(
        tmpBase, 
        hash, 
        `checkpoint-${encodeURIComponent(tag)}.json`
      );
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }
}
