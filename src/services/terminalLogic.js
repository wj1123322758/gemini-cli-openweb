export function checkIsInGemini(term) {
    if (!term) return false;
    const buffer = term.buffer.active;
    const lastLineIdx = buffer.cursorY + buffer.baseY;
    for (let i = lastLineIdx; i >= Math.max(0, lastLineIdx - 10); i--) {
        const line = buffer.getLine(i)?.translateToString().trim() || "";
        // PowerShell prompt check
        if (line.includes('PS ') && line.includes(':')) return false;
        // Gemini prompt check
        if (line.startsWith('>') || line.includes('gemini>')) return true;
    }
    return false;
}

export function formatTodoContent(todo) {
    let content = todo.text;
    if (todo.imageUrl) {
        content += `
(REF_IMG: @${todo.imageUrl.replace('/todo-images/', 'todo-images/')})`;
    }
    return content;
}
