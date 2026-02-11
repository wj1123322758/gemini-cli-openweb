# Gemini CLI 命令参考文档

> 版本: 0.27.3  
> 基于源码分析生成

---

## 目录
- [会话管理](#会话管理)
- [工作区管理](#工作区管理)
- [系统设置](#系统设置)
- [信息查看](#信息查看)
- [MCP 扩展](#mcp-扩展)
- [扩展管理](#扩展管理)
- [记忆管理](#记忆管理)
- [开发工具](#开发工具)
- [其他命令](#其他命令)

---

## 会话管理

### `/chat` - 对话管理
| 子命令 | 语法 | 功能 |
|--------|------|------|
| `save` | `/chat save <tag>` | 保存当前对话为检查点，包含完整历史记录和认证类型 |
| `resume` | `/chat resume <tag>` | 从检查点恢复对话，会验证认证类型是否匹配 |
| `delete` | `/chat delete <tag>` | 删除指定标签的检查点文件 |
| `list` | `/chat list` | 列出所有保存的对话检查点，按修改时间排序 |
| `share` | `/chat share [file]` | 导出对话到 `.md` 或 `.json` 文件 |
| `debug` | `/chat debug` | 导出最近 API 请求为 JSON payload |

**关键实现细节:**
- 检查点存储路径: `~/.gemini/tmp/<project_hash>/checkpoint-<tag>.json`
- 恢复时验证 `authType`，切换账号后无法恢复之前的会话
- `share` 支持 `.md` 和 `.json` 格式，默认自动生成文件名

---

### `/clear` - 清屏
- **别名**: `Ctrl+L`
- **功能**: 清空终端屏幕并重置对话上下文
- **实现**: 触发 SessionEnd/Start hook，生成新的 session ID

---

### `/compress` - 压缩上下文
- **别名**: `/summarize`
- **功能**: 用摘要替换整个对话上下文，减少 token 使用
- **实现**: 调用 `tryCompressChat()` 生成高级别摘要

---

### `/rewind` - 回退消息
- **功能**: 浏览并回退到之前的任意消息
- **实现**: 显示 `RewindViewer` 组件，支持选择是否撤销文件更改

---

### `/restore` - 恢复文件
- **语法**: `/restore [file]`
- **功能**: 恢复文件到工具执行前的状态
- **注意**: 仅在启用 `--checkpointing` 时可用

---

### `/resume` - 浏览会话
- **功能**: 打开会话浏览器，查看自动保存的对话历史
- **实现**: 打开 `SessionBrowser` 对话框

---

### `/copy` - 复制输出
- **功能**: 复制 AI 最后一条输出到剪贴板
- **依赖**: 需要 `clipboardy` 库支持

---

## 工作区管理

### `/dir` / `/directory` - 工作区目录
| 子命令 | 语法 | 功能 |
|--------|------|------|
| `add` | `/dir add <path1,path2>` | 添加目录到工作区（支持逗号分隔多路径） |
| `show` | `/dir show` | 显示当前工作区的所有目录 |

**注意**: 在限制性沙箱配置文件中禁用，需改用 `--include-directories`

---

## 系统设置

### `/settings` - 设置管理
- **功能**: 打开交互式设置编辑器
- **说明**: 等同于编辑 `.gemini/settings.json`，但带验证和指导

---

### `/theme` - 主题切换
- **功能**: 打开主题选择对话框
- **实现**: 调用 `ui.openThemeDialog()`

---

### `/auth` - 认证管理
| 子命令 | 功能 |
|--------|------|
| `login` | 打开认证对话框，支持 OAuth 或 API Key |
| `logout` | 登出并清除凭证，重置认证类型 |

**注意**: `logout` 会剥离历史记录中的思考内容（thinking）

---

### `/model` - 模型配置
- **功能**: 刷新配额并打开模型选择对话框
- **实现**: 调用 `ui.openModelDialog()`

---

### `/vim` - Vim 模式
- **功能**: 切换 Vim 编辑模式
- **实现**: 调用 `ui.toggleVimEnabled()`

---

## 信息查看

### `/help` / `/?` - 帮助
- **功能**: 显示帮助信息
- **实现**: 添加 HELP 类型的消息到 UI

---

### `/stats` / `/usage` - 统计信息
| 子命令 | 功能 |
|--------|------|
| `session` | 显示会话持续时间、配额使用情况 |
| `model` | 显示模型统计信息 |
| `tools` | 显示工具调用统计 |

---

### `/context` - 查看上下文
- **功能**: 显示当前上下文窗口内容
- **实现**: 调用 `showContext()`

---

### `/about` - 版本信息
- **功能**: 显示 CLI 版本、操作系统、模型、认证类型等信息
- **信息包括**: CLI版本、Node版本、OS、沙盒环境、模型、认证类型、用户邮箱

---

## MCP 扩展

### `/mcp` - MCP 服务器管理
| 子命令 | 语法 | 功能 |
|--------|------|------|
| `list` / `ls` | `/mcp list` | 列出所有 MCP 服务器和工具 |
| `desc` | `/mcp desc` | 带描述列出（同 list + 描述） |
| `schema` | `/mcp schema` | 带 schema 详情列出 |
| `auth` | `/mcp auth <server>` | 启动指定服务器的 OAuth 认证流程 |
| `refresh` | `/mcp refresh` | 重启所有 MCP 服务器 |
| `enable` | `/mcp enable <server> [--session]` | 启用指定服务器 |
| `disable` | `/mcp disable <server> [--session]` | 禁用指定服务器 |

**快捷键**: `Ctrl+T` 切换显示/隐藏工具描述

---

### `/tools` - 工具列表
| 子命令 | 功能 |
|--------|------|
| `desc` | 列出可用工具（带描述） |
| `nodesc` | 列出可用工具（仅名称） |

---

## 扩展管理

### `/extensions` - 扩展管理
| 子命令 | 语法 | 功能 |
|--------|------|------|
| `list` | `/extensions list` | 列出已安装扩展及状态 |
| `update` | `/extensions update <names>` / `--all` | 更新指定或所有扩展 |
| `explore` | `/extensions explore` | 在浏览器打开扩展市场 |
| `restart` | `/extensions restart <names>` / `--all` | 重启扩展 |
| `enable` | `/extensions enable <name> [--scope]` | 启用扩展（支持 user/workspace/session 作用域） |
| `disable` | `/extensions disable <name> [--scope]` | 禁用扩展 |
| `install` | `/extensions install <source>` | 安装扩展（支持 git 或本地路径） |
| `link` | `/extensions link <path>` | 链接本地扩展（符号链接） |
| `uninstall` | `/extensions uninstall <name>` | 卸载扩展 |

---

## 记忆管理

### `/memory` - AI 记忆管理
| 子命令 | 语法 | 功能 |
|--------|------|------|
| `show` | `/memory show` | 显示当前记忆内容 |
| `add` | `/memory add <content>` | 添加内容到记忆 |
| `refresh` | `/memory refresh` | 从源文件重新加载记忆 |
| `list` | `/memory list` | 列出所有 GEMINI.md 文件路径 |

**说明**: 记忆从 `GEMINI.md` 文件加载，支持分层结构

---

### `/init` - 初始化 GEMINI.md
- **功能**: 分析项目并生成个性化的 `GEMINI.md` 文件
- **实现**: 启动临时子会话分析代码库结构

---

## 开发工具

### `/agents` - Agent 管理
| 子命令 | 语法 | 功能 |
|--------|------|------|
| `list` | `/agents list` | 列出本地和远程可用 agents |
| `refresh` | `/agents refresh` | 刷新 agent 注册表 |
| `enable` | `/agents enable <name>` | 启用指定 agent |
| `disable` | `/agents disable <name>` | 禁用指定 agent |
| `config` | `/agents config <name>` | 配置 agent 参数 |

---

### `/hooks` - Hook 管理
| 子命令 | 语法 | 功能 |
|--------|------|------|
| `panel` / `list` / `show` | `/hooks list` | 显示所有 hooks 及启用状态 |
| `enable` | `/hooks enable <name>` | 启用指定 hook |
| `disable` | `/hooks disable <name>` | 禁用指定 hook |
| `enable-all` | `/hooks enable-all` | 启用所有 hooks |
| `disable-all` | `/hooks disable-all` | 禁用所有 hooks |

---

### `/ide` - IDE 集成
| 子命令 | 功能 |
|--------|------|
| `status` | 检查 IDE 集成状态 |
| `install` | 安装 IDE 伴侣扩展 |
| `enable` | 启用 IDE 集成 |
| `disable` | 禁用 IDE 集成 |

---

### `/skills` - 技能管理
| 子命令 | 语法 | 功能 |
|--------|------|------|
| `list` | `/skills list [nodesc] [all]` | 列出可用技能 |
| `disable` | `/skills disable <name>` | 禁用指定技能 |
| `enable` | `/skills enable <name>` | 启用指定技能 |
| `reload` | `/skills reload` | 重新加载所有技能 |

---

### `/terminal-setup` - 终端配置
- **功能**: 为 VS Code/Cursor/Windsurf 配置多行输入支持

---

### `/oncall` - Issue 处理
| 子命令 | 语法 | 功能 |
|--------|------|------|
| `dedup` | `/oncall dedup [limit]` | 处理重复的 GitHub issues |

---

### `/setup-github` - GitHub 配置
- **功能**: 下载工作流和命令文件，配置 `.gitignore`

---

### `/profile` - 性能分析
- **功能**: 切换调试分析器显示（仅开发模式可用）
- **说明**: 显示性能分析数据

---

## 其他命令

### `/bug` - 提交 Bug 报告
- **语法**: `/bug [description]`
- **功能**: 收集环境信息，导出对话历史，打开 GitHub issue 页面

---

### `/docs` - 打开文档
- **功能**: 在浏览器中打开 Gemini CLI 官方文档

---

### `/editor` - 设置编辑器
- **功能**: 打开外部编辑器选择对话框

---

### `/permissions` - 权限管理
- **语法**: `/permissions trust [path]`
- **功能**: 管理文件夹信任设置

---

### `/policies` - 策略列表
- **语法**: `/policies list`
- **功能**: 按模式分组显示活动策略规则

---

### `/privacy` - 隐私声明
- **功能**: 打开隐私设置对话框

---

### `/quit` / `/exit` - 退出
- **功能**: 退出 CLI，显示会话持续时间

---

### `/yolo` - YOLO 模式
- **功能**: 切换自动批准模式（危险操作需谨慎）

---

### `/corgi` - 柯基模式（彩蛋）
- **功能**: 切换柯基模式显示（隐藏命令）

---

## 输入方式

### `@` 命令 - 文件引用
| 用法 | 示例 |
|------|------|
| `@<file>` | `@README.md 解释一下这个项目` |
| `@<dir>` | `@src/ 总结代码结构` |

**说明**: 支持 git 感知过滤，自动忽略 `.gitignore` 中的文件

---

### `!` 命令 - Shell 执行
| 用法 | 示例 |
|------|------|
| `!<command>` | `!git status` |
| `!` | 切换 Shell 模式（进入/退出）

---

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+T` | 切换 MCP 工具描述显示 |
| `Ctrl+L` | 清屏（同 `/clear`） |
| `Ctrl+Z` | 撤销输入 |
| `Ctrl+Shift+Z` | 重做输入 |

---

## 注意事项

1. **认证绑定**: `/chat save` 的检查点绑定当前认证类型，切换账号后无法恢复
2. **路径隔离**: 检查点按项目哈希隔离，不同项目互不可见
3. **checkpoint 依赖**: `/restore` 需要 `--checkpointing` 选项启用
4. **开发模式**: `/profile` 等命令仅在开发模式可用
