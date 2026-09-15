"""FastAPI 应用入口。

挂载静态资源、模板引擎、API 路由,提供首页渲染。
后续接入代码大模型时只需替换 services/llm_service.py 的实现。
"""
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.requests import Request

from src.api.routes import router as api_router

BASE_DIR = Path(__file__).resolve().parent

app = FastAPI(title="AI Code Assistant", version="0.1.0")

# 静态资源(css/js)
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")

# Jinja2 模板
templates = Jinja2Templates(directory=BASE_DIR / "templates")

# API 路由
app.include_router(api_router, prefix="/api")


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    """首页:编程助手主界面。"""
    return templates.TemplateResponse(request, "index.html", {})


@app.get("/health")
async def health():
    return {"status": "ok"}
