# Gemini Station: CLI OpenWeb (Reborn)

> **为极客而生：基于 Node.js + Vue3 的 Gemini CLI 全能网页增强界面。**
> *Geek-Oriented Web UI for Gemini CLI, featuring high-performance terminal interaction and mission-driven workflow.*

---

## 🌟 项目亮点 (Highlights)

### 1. 🚀 招牌 Mission 控制系统 (The Mission Hub)
这是本项目的“灵魂”功能，将灵感捕获与 AI 生产力完美结合：
*   **全方位截图粘贴**：支持在记录任务或编辑详情时，直接从剪贴板 `Ctrl+V` 粘贴截图。图片自动存入项目根目录，绝不丢失。
*   **状态动力学**：任务支持“待办、进行中、完成”全生命周期管理。
    *   **自动推力**：点击“注入”任务到终端时，状态自动切换至“进行中”，伴随黄色呼吸灯提示。
*   **终端深度联动**：支持一键“注入并清空”或“末尾追加”，将想法精准送达 Gemini 核心。
*   **内联极速编辑**：单击任务文本即刻进入编辑模式，`Ctrl + Enter` 或失去焦点自动保存。

### 2. ⚡ 赛博实验室美学 (Cyberpunk Lab Aesthetic)
*   **玻璃拟态 (Glassmorphism)**：深度定制的毛玻璃背景与 `backdrop-blur-2xl` 特效。
*   **矩阵操作面板**：功能按钮采用 2x2 精密矩阵布局，悬浮时以抽屉式优雅展开。
*   **动态交互**：带有 Neon Glow 霓虹外发光、呼吸灯状态指示以及平滑的微动动画。

### 3. 🧠 强化记忆找回 (Deep Memory Recovery)
*   **多 Hash 路径兼容**：针对 Windows 环境下的路径歧义进行了专项优化。无论项目路径如何变化，系统都能精准聚合并找回属于该项目的会话存档。
*   **项目化存储**：任务清单、截图、备份全部存放于项目根目录下，实现真正的“数据随项目迁移”。

---

## 🛠️ 安装与启动 (Setup & Start)

### 前提条件
1.  确保您的系统已安装 [Node.js](https://nodejs.org/) (建议 v18+)。
2.  确保已安装官方 [Gemini CLI](https://github.com/google-gemini/gemini-cli) 并已完成 `gemini /auth login`。

### 快速开始
1.  **克隆仓库**：
    ```bash
    git clone https://github.com/wj1123322758/gemini-cli-openweb.git
    cd gemini-cli-openweb
    ```
2.  **安装依赖**：
    ```bash
    npm install
    ```
3.  **一键启动**：
    直接双击根目录下的 **`start.bat`**。
    *该脚本会自动清理 3001 端口占用、编译前端并启动后端服务。*

---

## ⌨️ 快捷操作 (Shortcuts)

| 按键 / 动作 | 功能描述 |
| :--- | :--- |
| `Ctrl + Y` | **YOLO 模式**：直接发送控制码切换自动批准状态 |
| `Ctrl + V` | **截图捕获**：在任务输入框或编辑框直接上传截图 |
| `Ctrl + Enter` | **快速提交**：保存当前编辑的任务想法 |
| `鼠标悬停` | **展开控制台**：显示注入、完成、删除等高级功能 |
| `单击文本` | **即时编辑**：直接修改已存在的任务内容 |

---

## 📂 存储结构 (Data Structure)

项目运行后，会在您的项目根目录下生成以下文件：
*   `gemini-todo.json`：您的核心任务数据库。
*   `todo-images/`：存放所有粘贴的截图。
*   `todo-backups/`：自动生成的任务历史快照（保留最近 10 次修改）。
*   `GEMINI.md`：记录了本项目的核心逻辑与开发者经验。

---

## 🤝 贡献与反馈

如果您有任何极客想法或发现了 BUG，欢迎提交 Issue 或 Pull Request。

**Enjoy your ideation journey at Gemini Station!** 🚀
