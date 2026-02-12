import path from 'path';
import crypto from 'crypto';

export function getPossibleHashes(projectPath) {
    if (!projectPath) return [];
    // 移除末尾斜杠并统一为标准绝对路径
    const p = path.resolve(projectPath).replace(/[\\\/]+$/, '');
    
    // 生成多种变体以匹配 Gemini CLI 可能生成的不同 Hash
    const variants = [
        p, 
        p.toLowerCase(), 
        p.replace(/\\/g, '/'), 
        p.toLowerCase().replace(/\\/g, '/')
    ];
    
    return [...new Set(variants)].map(v => 
        crypto.createHash('sha256').update(v).digest('hex')
    );
}

export function normalizePath(p) {
    if (!p) return '';
    // 移除可能存在的 .gemini 临时路径后缀，并处理编码
    return p.replace(/[\\\/]\.gemini.*/, '').trim();
}
