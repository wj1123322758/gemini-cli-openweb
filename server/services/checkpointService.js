import fs from 'fs';
import path from 'path';
import os from 'os';
import { getPossibleHashes } from '../utils/pathHelper.js';

export class CheckpointService {
    getCheckpoints(projectPath) {
        const tmpBase = path.join(os.homedir(), '.gemini', 'tmp');
        if (!fs.existsSync(tmpBase)) return [];
        
        let allSessions = [];
        const targetHashes = getPossibleHashes(projectPath);
        
        targetHashes.forEach(hash => {
            const projectDir = path.join(tmpBase, hash);
            if (fs.existsSync(projectDir)) {
                try {
                    const files = fs.readdirSync(projectDir);
                    const sessions = files.filter(f => f.startsWith('checkpoint-') && f.endsWith('.json')).map(f => {
                        try {
                            const filePath = path.join(projectDir, f);
                            const tag = decodeURIComponent(f).replace('checkpoint-', '').replace('.json', '').trim();
                            const stats = fs.statSync(filePath);
                            const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                            const history = content.history || [];
                            const preview = history.filter(m => m.role === 'user').map(m => {
                                if (m.parts && m.parts[0] && m.parts[0].text) return m.parts[0].text.substring(0, 200).replace(/\n/g, ' ').trim();
                                return '';
                            }).filter(t => t.length > 0);
                            return { 
                                tag, 
                                name: tag, 
                                time: new Date(stats.mtime).toLocaleString(), 
                                preview, 
                                rawTime: stats.mtime.getTime() 
                            };
                        } catch (e) { return null; }
                    }).filter(s => s !== null);
                    allSessions = allSessions.concat(sessions);
                } catch (e) {}
            }
        });

        const uniqueSessions = [];
        const seenTags = new Set();
        allSessions.sort((a, b) => b.rawTime - a.rawTime).forEach(s => {
            if (!seenTags.has(s.tag)) { 
                seenTags.add(s.tag); 
                uniqueSessions.push(s); 
            }
        });
        return uniqueSessions;
    }

    deleteCheckpoint(projectPath, tag) {
        const tmpBase = path.join(os.homedir(), '.gemini', 'tmp');
        getPossibleHashes(projectPath).forEach(hash => {
            const filePath = path.join(tmpBase, hash, `checkpoint-${encodeURIComponent(tag)}.json`);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        });
    }
}
