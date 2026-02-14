import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

export class SkillService {
    constructor() {
        this.skillsDir = path.join(os.homedir(), '.gemini', 'skills');
        this.userSettingsPath = path.join(os.homedir(), '.gemini', 'settings.json');
        this.workspaceSettingsPath = path.join(process.cwd(), '.gemini', 'settings.json');
        this.cache = null;
        this.cacheTime = 0;
        this.cacheTTL = 30000; // 30秒缓存
    }

    /**
     * 获取禁用列表
     */
    getDisabledSkills() {
        const disabled = new Set();
        
        // 读取用户级设置
        try {
            if (fs.existsSync(this.userSettingsPath)) {
                const userSettings = JSON.parse(fs.readFileSync(this.userSettingsPath, 'utf-8'));
                if (userSettings.disabledSkills) {
                    userSettings.disabledSkills.forEach(s => disabled.add(s));
                }
            }
        } catch (e) {
            console.error('[SKILL] Failed to read user settings:', e.message);
        }
        
        // 读取工作区设置
        try {
            if (fs.existsSync(this.workspaceSettingsPath)) {
                const workspaceSettings = JSON.parse(fs.readFileSync(this.workspaceSettingsPath, 'utf-8'));
                if (workspaceSettings.disabledSkills) {
                    workspaceSettings.disabledSkills.forEach(s => disabled.add(s));
                }
            }
        } catch (e) {
            console.error('[SKILL] Failed to read workspace settings:', e.message);
        }
        
        return disabled;
    }

    /**
     * 获取已安装的 Skills 列表
     */
    async getSkills() {
        // 检查缓存
        const now = Date.now();
        if (this.cache && (now - this.cacheTime) < this.cacheTTL) {
            return this.cache;
        }

        try {
            // 直接从文件系统读取 skills
            const skills = this.readSkillsFromFilesystem();
            
            // 更新缓存
            this.cache = skills;
            this.cacheTime = now;
            
            return skills;
        } catch (error) {
            console.error('[SKILL] Failed to get skill list:', error.message);
            return this.cache || []; // 返回缓存或空数组
        }
    }

    /**
     * 从文件系统读取 skills
     */
    readSkillsFromFilesystem() {
        const skills = [];
        const disabledSkills = this.getDisabledSkills();
        
        if (!fs.existsSync(this.skillsDir)) {
            return skills;
        }
        
        const entries = fs.readdirSync(this.skillsDir, { withFileTypes: true });
        
        for (const entry of entries) {
            if (entry.isDirectory()) {
                const skillName = entry.name;
                const skillPath = path.join(this.skillsDir, skillName, 'SKILL.md');
                
                if (fs.existsSync(skillPath)) {
                    const content = fs.readFileSync(skillPath, 'utf-8');
                    const description = this.extractDescription(content);
                    
                    skills.push({
                        name: skillName,
                        enabled: !disabledSkills.has(skillName),
                        description: description,
                        location: skillPath
                    });
                }
            }
        }
        
        return skills.sort((a, b) => a.name.localeCompare(b.name));
    }

    /**
     * 从 SKILL.md 提取描述
     */
    extractDescription(content) {
        const lines = content.split('\n');
        for (const line of lines) {
            const trimmed = line.trim();
            // 跳过标题和空行
            if (trimmed && !trimmed.startsWith('#')) {
                return trimmed.substring(0, 100); // 限制长度
            }
        }
        return '';
    }

    /**
     * 异步执行 gemini skill list 命令
     */
    execGeminiSkillList() {
        return new Promise((resolve, reject) => {
            // 使用 shell 执行，继承环境变量
            const proc = spawn('npx gemini skill list', {
                shell: true,
                windowsHide: true,
                stdio: ['ignore', 'pipe', 'pipe']
            });

            let stdout = '';
            let stderr = '';

            proc.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            proc.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            // 设置超时
            const timeout = setTimeout(() => {
                proc.kill();
                // 即使超时，如果有输出也使用它
                const output = stdout || stderr;
                if (output.includes('Discovered Agent Skills')) {
                    resolve(output);
                } else {
                    reject(new Error('Command timeout'));
                }
            }, 10000);

            proc.on('close', (code) => {
                clearTimeout(timeout);
                const output = stdout || stderr;
                
                if (output.includes('Discovered Agent Skills')) {
                    resolve(output);
                } else if (code !== 0) {
                    reject(new Error(`Command failed with code ${code}: ${stderr}`));
                } else {
                    resolve(output);
                }
            });

            proc.on('error', (err) => {
                clearTimeout(timeout);
                reject(err);
            });
        });
    }

    /**
     * 解析 gemini skill list 的输出
     */
    parseSkillList(output) {
        const skills = [];
        const lines = output.split('\n');
        
        let currentSkill = null;
        let pendingDescription = null;
        let pendingLocation = null;
        let inDescription = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();
            
            // 跳过空行和头部信息
            if (!trimmed || 
                trimmed.includes('Loaded cached credentials') ||
                trimmed.includes('Hook registry initialized') ||
                trimmed.includes('Discovered Agent Skills') ||
                trimmed.startsWith('npx :') ||
                trimmed.startsWith('At line:') ||
                trimmed.startsWith('+ ') ||
                trimmed.startsWith('    + ') ||
                trimmed.includes('CategoryInfo') ||
                trimmed.includes('FullyQualifiedErrorId') ||
                trimmed.startsWith('>')) {
                continue;
            }
            
            // 匹配 Skill 名称行 (e.g., "create-adaptable-composable [Enabled]")
            const nameMatch = line.match(/^(\S+)\s+\[(Enabled|Disabled)\]\s*$/);
            if (nameMatch) {
                // 保存之前的 skill
                if (currentSkill && pendingLocation) {
                    currentSkill.description = pendingDescription || '';
                    currentSkill.location = pendingLocation;
                    skills.push(currentSkill);
                }
                
                currentSkill = {
                    name: nameMatch[1],
                    enabled: nameMatch[2] === 'Enabled',
                    description: '',
                    location: ''
                };
                pendingDescription = null;
                pendingLocation = null;
                inDescription = false;
                continue;
            }
            
            // 匹配 Description 行
            const descMatch = line.match(/^\s+Description:\s*(.*)$/);
            if (descMatch) {
                // 如果已经有完整的 pendingDescription 和 pendingLocation，说明是新 skill
                if (currentSkill && pendingDescription && pendingLocation) {
                    currentSkill.description = pendingDescription;
                    currentSkill.location = pendingLocation;
                    skills.push(currentSkill);
                    currentSkill = { name: '', enabled: true, description: '', location: '' };
                }
                
                pendingDescription = descMatch[1].trim();
                inDescription = true;
                continue;
            }
            
            // 匹配 Location 行
            const locMatch = line.match(/^\s+Location:\s*(.*)$/);
            if (locMatch) {
                pendingLocation = locMatch[1].trim();
                inDescription = false;
                
                // 如果当前 skill 没有名称，尝试从 location 提取
                if (currentSkill && !currentSkill.name && pendingLocation) {
                    const match = pendingLocation.match(/skills[\\/]([^\\/]+)[\\/]/);
                    if (match) {
                        currentSkill.name = match[1];
                    }
                }
                continue;
            }
            
            // 处理续行（以空格开头但不是关键字）
            if (line.match(/^\s+/) && 
                !line.match(/^\s*(Description|Location):/) &&
                trimmed) {
                if (inDescription && pendingDescription !== null) {
                    pendingDescription += ' ' + trimmed;
                } else if (!inDescription && pendingLocation !== null) {
                    pendingLocation += trimmed;
                }
            }
        }
        
        // 添加最后一个 skill
        if (currentSkill && pendingLocation) {
            currentSkill.description = pendingDescription || '';
            currentSkill.location = pendingLocation;
            skills.push(currentSkill);
        }
        
        console.log('[SKILL] Parsed', skills.length, 'skills');
        skills.forEach(s => console.log('  -', s.name, `[${s.enabled ? 'Enabled' : 'Disabled'}]`));
        return skills;
    }

    /**
     * 删除指定的 Skill
     */
    async deleteSkill(skillName) {
        try {
            await this.execGeminiCommand(['skill', 'delete', skillName]);
            this.cache = null; // 清除缓存
            return { success: true };
        } catch (error) {
            console.error(`[SKILL] Failed to delete skill ${skillName}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * 获取 Skill 文档内容
     */
    async getSkillDoc(skillName) {
        try {
            const skillPath = path.join(this.skillsDir, skillName, 'SKILL.md');
            if (fs.existsSync(skillPath)) {
                return fs.readFileSync(skillPath, 'utf8');
            }
            
            // 尝试从 location 读取
            const skills = await this.getSkills();
            const skill = skills.find(s => s.name === skillName);
            if (skill && skill.location && fs.existsSync(skill.location)) {
                return fs.readFileSync(skill.location, 'utf8');
            }
            
            return null;
        } catch (error) {
            console.error(`[SKILL] Failed to read skill doc ${skillName}:`, error.message);
            return null;
        }
    }

    /**
     * 启用/禁用 Skill
     */
    async toggleSkill(skillName, enable) {
        try {
            const action = enable ? 'enable' : 'disable';
            await this.execGeminiCommand(['skill', action, skillName]);
            this.cache = null; // 清除缓存
            return { success: true };
        } catch (error) {
            console.error(`[SKILL] Failed to ${enable ? 'enable' : 'disable'} skill ${skillName}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * 异步执行 gemini 命令
     */
    execGeminiCommand(args) {
        return new Promise((resolve, reject) => {
            // 使用 shell 执行，继承环境变量
            const proc = spawn(`npx gemini ${args.join(' ')}`, {
                shell: true,
                windowsHide: true,
                stdio: ['ignore', 'pipe', 'pipe']
            });

            let stdout = '';
            let stderr = '';

            proc.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            proc.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            const timeout = setTimeout(() => {
                proc.kill();
                reject(new Error('Command timeout'));
            }, 15000);

            proc.on('close', (code) => {
                clearTimeout(timeout);
                // gemini 命令可能输出到 stderr 但执行成功
                const output = stdout || stderr;
                if (code === 0 || output.includes('enabled') || output.includes('disabled')) {
                    resolve(output);
                } else {
                    reject(new Error(stderr || `Command failed with code ${code}`));
                }
            });

            proc.on('error', (err) => {
                clearTimeout(timeout);
                reject(err);
            });
        });
    }

    /**
     * 打开文件夹
     */
    openFolder(folderPath) {
        try {
            // Windows 使用 explorer
            if (process.platform === 'win32') {
                spawn('explorer', [folderPath], { detached: true });
            } else if (process.platform === 'darwin') {
                // macOS 使用 open
                spawn('open', [folderPath], { detached: true });
            } else {
                // Linux 使用 xdg-open
                spawn('xdg-open', [folderPath], { detached: true });
            }
        } catch (error) {
            console.error('[SKILL] Failed to open folder:', error.message);
        }
    }
}
