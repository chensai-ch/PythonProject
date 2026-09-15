# 轻量化 AI 编程助手

基于 Web 前端 + FastAPI + 代码大模型的轻量化编程助手,支持粘贴代码后由 AI 进行解释、查 Bug、生成单元测试、代码转语言。

## 技术栈
- 前端:原生 HTML / CSS / JavaScript(无框架,内置极简 Markdown 渲染器)
- 后端:FastAPI + Uvicorn + Jinja2
- 模型层:代码大模型(预留接口,当前为 stub)

## 环境要求
- Python 3.13+(在 3.14 上验证通过)
- 依赖见 `requirements.txt`

## 安装
```bash
python -m venv .venv
.venv\Scripts\activate         # Windows
# source .venv/bin/activate      # Linux/macOS
pip install -r requirements.txt
```

## 运行
```bash
python run.py
```
浏览器访问 http://127.0.0.1:8000

## 功能
- **解释代码**:逐段说明代码功能与数据流
- **查找 Bug**:列出潜在问题与修复建议
- **生成测试**:自动产出覆盖正常/边界/异常路径的单元测试
- **代码转语言**:在主流编程语言间转换并标注差异

## 项目结构
```
src/
  app.py                  # FastAPI 入口:静态资源/模板/路由挂载
  api/
    schemas.py            # Pydantic 请求/响应模型(AnalysisMode 枚举)
    routes.py             # POST /api/analyze、GET /api/languages
  services/
    llm_service.py        # LLM 服务封装(当前 stub,待接真实模型)
  templates/index.html     # 主界面
  static/
    css/style.css         # 深色科技风样式
    js/app.js             # 交互逻辑 + Markdown 渲染
run.py                     # 启动入口(含热重载)
requirements.txt
```

## 接入代码大模型
只需替换 `src/services/llm_service.py` 的 `analyze()` 实现:按 `mode` 拼装不同 system prompt,调用代码大模型(Qwen-Code / DeepSeek-Coder / StarCoder 等),可选 SSE 流式输出。API 层与前端无需改动——stub 已按最终契约实现。

## API
- `GET /` 首页
- `GET /health` 健康检查
- `GET /api/languages` 支持的语言列表
- `POST /api/analyze` 代码分析
  ```json
  {"code": "def f(x): return x+1", "language": "Python", "mode": "explain"}
  ```
  `mode`: `explain` | `bugs` | `tests` | `convert`(convert 需附加 `target_language`)
