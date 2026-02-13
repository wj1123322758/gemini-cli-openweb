import fs from 'fs';
import path from 'path';
import os from 'os';
import { getPossibleHashes, normalizePath } from '../utils/pathHelper.js';

export class CheckpointService {
    /**
     * 获取手动存档的会话（带明确 Tag 的 checkpoint）
     */
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
                    const sessions = files
                        .filter(f => f.startsWith('checkpoint-') && f.endsWith('.json'))
                        .map(f => {
                            try {
                                const filePath = path.join(projectDir, f);
                                const tag = decodeURIComponent(f).replace('checkpoint-', '').replace('.json', '').trim();
                                const stats = fs.statSync(filePath);
                                const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                                const messages = content.messages || content.history || [];
                                const preview = this._extractPreviewFromMessages(messages);
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

    /**
     * 检查 session 是否有至少一条 user 或 gemini 消息（不只是系统消息）
     * 与 gemini 源码 hasUserOrAssistantMessage 保持一致
     */
    _hasUserOrAssistantMessage(messages) {
        return messages.some(msg => {
            const type = msg.type || msg.role;
            return type === 'user' || type === 'gemini' || type === 'assistant';
        });
    }

    /**
     * 清理消息内容
     */
    _cleanMessage(content) {
        if (typeof content === 'string') {
            return content.replace(/\n+/g, ' ').replace(/\s+/g, ' ').replace(/[^\x20-\x7E]+/g, '').trim();
        }
        return '';
    }

    /**
     * 从 session 的 messages 中提取第一条真实用户消息
     * 与 gemini extractFirstUserMessage 一致：过滤掉 / 开头的命令
     */
    _extractFirstUserMessageFromSession(messages) {
        // 先尝试过滤掉以 / 或 ? 开头的命令
        const userMessage = messages
            .filter(msg => {
                const type = msg.type || msg.role;
                if (type !== 'user') return false;
                const text = this._getMessageText(msg);
                return text && !text.startsWith('/') && !text.startsWith('?') && text.trim().length > 0;
            })
            .find(msg => msg);
        
        if (userMessage) {
            return this._getMessageText(userMessage).substring(0, 50) + '...';
        }
        
        // 回退：返回第一条用户消息（即使是命令）
        const firstMsg = messages.find(msg => (msg.type || msg.role) === 'user');
        if (firstMsg) {
            const text = this._getMessageText(firstMsg);
            return text.substring(0, 50) + (text.length > 50 ? '...' : '');
        }
        
        return '未命名会话';
    }

    /**
     * 获取消息文本（兼容两种格式）
     */
    _getMessageText(msg) {
        if (!msg) return '';
        
        if (msg.parts && msg.parts[0] && msg.parts[0].text) {
            return msg.parts[0].text.trim();
        }
        
        if (msg.content && Array.isArray(msg.content)) {
            const textParts = msg.content.filter(c => c.text).map(c => c.text);
            return textParts.join(' ').trim();
        }
        
        return '';
    }

    /**
     * 获取自动保存的临时会话（session-*.json 文件）
     * 与 gemini /resume 完全一致：
     * - 只扫描当前项目目录
     * - 去重（按 sessionId，保留 lastUpdated 最新的）
     * - 过滤（只保留有 user/gemini 消息的）
     * - 按 startTime 排序（升序，最老的在前）
     * - 索引从 1 开始，对应 gemini --resume <index>
     */
    getResumes(projectPath) {
        const tmpBase = path.join(os.homedir(), '.gemini', 'tmp');
        if (!fs.existsSync(tmpBase)) return [];
        
        // 如果没有指定 projectPath，返回空
        if (!projectPath) return [];
        
        // 获取该路径对应的所有可能 hash
        const targetHashes = getPossibleHashes(projectPath);
        
        let allSessions = [];
        
        // 只扫描当前项目的目录
        for (const hash of targetHashes) {
            const chatsDir = path.join(tmpBase, hash, 'chats');
            if (!fs.existsSync(chatsDir)) continue;
            
            try {
                const files = fs.readdirSync(chatsDir);
                for (const f of files) {
                    if (!f.startsWith('session-') || !f.endsWith('.json')) continue;
                    
                    try {
                        const filePath = path.join(chatsDir, f);
                        const stats = fs.statSync(filePath);
                        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                        
                        // 验证必要字段
                        if (!content.sessionId || !content.messages || !Array.isArray(content.messages)) {
                            continue;
                        }
                        
                        // 过滤：只保留有 user 或 gemini 消息的会话
                        if (!this._hasUserOrAssistantMessage(content.messages)) {
                            continue;
                        }
                        
                        // 使用 summary 作为标题，没有则使用第一条用户消息
                        let name = content.summary ? content.summary.trim() : '';
                        if (!name) {
                            name = this._extractFirstUserMessageFromSession(content.messages);
                        }
                        
                        allSessions.push({
                            id: content.sessionId,
                            name: name,
                            msgCount: content.messages.length,
                            startTime: content.startTime,
                            lastUpdated: content.lastUpdated,
                            fileName: f,
                            projectPath: projectPath,
                            projectHash: hash
                        });
                    } catch (e) {}
                }
            } catch (e) {}
        }
        
        // 去重：按 sessionId，保留 lastUpdated 最新的
        const uniqueMap = new Map();
        for (const session of allSessions) {
            if (!uniqueMap.has(session.id) ||
                new Date(session.lastUpdated).getTime() > new Date(uniqueMap.get(session.id).lastUpdated).getTime()) {
                uniqueMap.set(session.id, session);
            }
        }
        
        const uniqueSessions = Array.from(uniqueMap.values());
        
        // 按 startTime 升序排列（最老的在前）
        uniqueSessions.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        
        // 设置索引（1-based，最新的索引最大）
        uniqueSessions.forEach((session, idx) => {
            session.index = idx + 1;
            session.isCurrent = idx === uniqueSessions.length - 1;
            session.age = this._formatAge(new Date(session.lastUpdated));
        });
        
        // 按 lastUpdated 倒序返回（用于 UI 显示，最新的在前）
        return uniqueSessions.reverse().slice(0, 20);
    }

    /**
     * 格式化时间为友好显示（如 25s, 1d）
     */
    _formatAge(mtime) {
        const now = new Date();
        const diff = Math.floor((now - mtime) / 1000);
        
        if (diff < 60) return `${diff}s`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
        return `${Math.floor(diff / 86400)}d`;
    }

    /**
     * 从 messages 数组中提取预览（通用方法）
     */
    _extractPreviewFromMessages(messages) {
        const SYSTEM_PROMPT_PREFIX = 'This is the Gemini CLI';
        
        return messages
            .filter(m => {
                const role = m.role || m.type;
                if (role !== 'user') return false;
                const text = this._getMessageText(m);
                return text && !text.startsWith(SYSTEM_PROMPT_PREFIX);
            })
            .slice(0, 5)
            .map(m => {
                const text = this._getMessageText(m);
                return text.substring(0, 200).replace(/\n/g, ' ').trim();
            })
            .filter(t => t.length > 0);
    }

    deleteCheckpoint(projectPath, tag) {
        const tmpBase = path.join(os.homedir(), '.gemini', 'tmp');
        getPossibleHashes(projectPath).forEach(hash => {
            const filePath = path.join(tmpBase, hash, `checkpoint-${encodeURIComponent(tag)}.json`);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        });
    }
}
