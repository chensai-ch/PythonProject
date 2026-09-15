// AI 编程助手 - 前端逻辑
// 当前对接 /api/analyze(stub),后续接入真实 LLM 无需改前端

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const state = {
    mode: "explain",
    languages: [],
};

const MODE_LABELS = {
    explain: "解释代码",
    bugs: "查找 Bug",
    tests: "生成测试",
    convert: "代码转语言",
};

// ---------- 初始化 ----------
async function init() {
    await loadLanguages();
    bindEvents();
    updateLineCount();
}

async function loadLanguages() {
    try {
        const res = await fetch("/api/languages");
        const data = await res.json();
        state.languages = data.languages;
        fillSelect($("#language"), state.languages, "auto");
        // 目标语言下拉不包含 auto
        fillSelect($("#target-language"), state.languages.filter((l) => l !== "auto"), "Python");
    } catch (e) {
        setStatus(`加载语言列表失败: ${e.message}`, "error");
    }
}

function fillSelect(sel, items, defaultValue) {
    sel.innerHTML = "";
    items.forEach((item) => {
        const opt = document.createElement("option");
        opt.value = item;
        opt.textContent = item;
        if (item === defaultValue) opt.selected = true;
        sel.appendChild(opt);
    });
}

// ---------- 事件绑定 ----------
function bindEvents() {
    // 模式切换
    $$(".mode").forEach((btn) => {
        btn.addEventListener("click", () => selectMode(btn.dataset.mode));
    });

    // 输入计数
    $("#code-input").addEventListener("input", updateLineCount);

    // Tab 键缩进(而非失焦)
    $("#code-input").addEventListener("keydown", (e) => {
        if (e.key === "Tab") {
            e.preventDefault();
            const ta = e.target;
            const start = ta.selectionStart;
            const end = ta.selectionEnd;
            ta.value = ta.value.slice(0, start) + "    " + ta.value.slice(end);
            ta.selectionStart = ta.selectionEnd = start + 4;
            updateLineCount();
        }
    });

    // Ctrl/Cmd + Enter 提交
    $("#code-input").addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
            e.preventDefault();
            submit();
        }
    });

    $("#analyze-btn").addEventListener("click", submit);
}

function selectMode(mode) {
    state.mode = mode;
    $$(".mode").forEach((b) => b.classList.toggle("active", b.dataset.mode === mode));
    // convert 模式才显示目标语言
    $("#target-field").hidden = mode !== "convert";
    // 更新按钮文案
    const btnLabel = $(".btn-label");
    btnLabel.textContent = mode === "convert" ? "开始转换" : "开始分析";
}

function updateLineCount() {
    const text = $("#code-input").value;
    const lines = text ? text.split("\n").length : 0;
    const chars = text.length;
    $("#line-count").textContent = `${lines} 行 · ${chars} 字符`;
}

// ---------- 提交分析 ----------
async function submit() {
    const code = $("#code-input").value.trim();
    if (!code) {
        renderError("请先粘贴代码");
        return;
    }

    const body = {
        code,
        language: $("#language").value,
        mode: state.mode,
    };
    if (state.mode === "convert") {
        body.target_language = $("#target-language").value;
    }

    setLoading(true);
    renderLoading();
    setStatus(`正在${MODE_LABELS[state.mode]}…`, "busy");

    try {
        const res = await fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail || `HTTP ${res.status}`);
        }
        const data = await res.json();
        renderResult(data.result, data.elapsed_ms);
        setStatus(`完成 · ${data.elapsed_ms}ms`, "ok");
    } catch (e) {
        renderError(e.message);
        setStatus(`出错: ${e.message}`, "error");
    } finally {
        setLoading(false);
    }
}

function setLoading(loading) {
    $("#analyze-btn").disabled = loading;
    $("#analyze-btn .spinner").hidden = !loading;
}

// ---------- 渲染 ----------
function renderLoading() {
    const out = $("#output");
    out.innerHTML = `
        <div class="placeholder">
            <div class="spinner" style="width:28px;height:28px;border-width:3px;border-color:rgba(34,211,238,0.2);border-top-color:var(--accent);"></div>
            <p>AI 正在分析代码…</p>
        </div>`;
}

function renderResult(markdown, elapsedMs) {
    const out = $("#output");
    const html = renderMarkdown(markdown);
    out.innerHTML = html;
    $("#result-meta").textContent = `${elapsedMs}ms`;
    out.scrollTop = 0;
}

function renderError(msg) {
    const out = $("#output");
    out.innerHTML = `<div class="error-box">⚠️ ${escapeHtml(msg)}</div>`;
}

function setStatus(text, level) {
    $("#status").textContent = text;
    const dot = $("#status-dot");
    dot.classList.remove("busy", "error");
    if (level === "busy") dot.classList.add("busy");
    if (level === "error") dot.classList.add("error");
}

// ---------- 极简 Markdown 渲染 ----------
// 支持:代码块、标题、列表、引用、粗体、行内代码、段落
function renderMarkdown(md) {
    // 1. 提取代码块
    const segments = [];
    const parts = md.split(/```(\w*)\n([\s\S]*?)```/g);
    // parts: [text, lang, code, text, lang, code, ...]
    for (let i = 0; i < parts.length; i += 3) {
        const text = parts[i] || "";
        const lang = parts[i + 1];
        const code = parts[i + 2];
        if (text) segments.push({ type: "md", value: text });
        if (code !== undefined) segments.push({ type: "code", lang: lang || "", value: code });
    }

    return segments.map((seg) => {
        if (seg.type === "code") {
            return `<pre><code>${escapeHtml(seg.value.replace(/\n$/, ""))}</code></pre>`;
        }
        return renderInline(seg.value);
    }).join("");
}

function renderInline(text) {
    // 按行处理,识别标题/列表/引用/段落
    const lines = text.split("\n");
    const out = [];
    let listType = null;   // "ul" | "ol"
    let listItems = [];
    let paragraph = [];

    function flushList() {
        if (listItems.length) {
            const tag = listType === "ol" ? "ol" : "ul";
            out.push(`<${tag}>${listItems.map((i) => `<li>${i}</li>`).join("")}</${tag}>`);
            listItems = [];
            listType = null;
        }
    }
    function flushParagraph() {
        if (paragraph.length) {
            out.push(`<p>${paragraph.join("<br>")}</p>`);
            paragraph = [];
        }
    }

    for (const raw of lines) {
        const line = raw.trimEnd();
        if (!line.trim()) { flushList(); flushParagraph(); continue; }

        // 标题
        let m;
        if ((m = line.match(/^###\s+(.*)$/))) {
            flushList(); flushParagraph();
            out.push(`<h3>${inlineFmt(m[1])}</h3>`);
        } else if ((m = line.match(/^##\s+(.*)$/))) {
            flushList(); flushParagraph();
            out.push(`<h2>${inlineFmt(m[1])}</h2>`);
        } else if ((m = line.match(/^#\s+(.*)$/))) {
            flushList(); flushParagraph();
            out.push(`<h1>${inlineFmt(m[1])}</h1>`);
        } else if ((m = line.match(/^>\s+(.*)$/))) {
            flushList(); flushParagraph();
            out.push(`<blockquote>${inlineFmt(m[1])}</blockquote>`);
        } else if ((m = line.match(/^\s*[-*]\s+(.*)$/))) {
            flushParagraph();
            if (listType && listType !== "ul") flushList();
            listType = "ul";
            listItems.push(inlineFmt(m[1]));
        } else if ((m = line.match(/^\s*\d+\.\s+(.*)$/))) {
            flushParagraph();
            if (listType && listType !== "ol") flushList();
            listType = "ol";
            listItems.push(inlineFmt(m[1]));
        } else {
            flushList();
            paragraph.push(inlineFmt(line.trim()));
        }
    }
    flushList();
    flushParagraph();
    return out.join("\n");
}

function inlineFmt(text) {
    return escapeHtml(text)
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/\*([^*]+)\*/g, "<em>$1</em>")
        .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function escapeHtml(s) {
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

// ---------- 启动 ----------
init();
