"""API 路由:接收代码分析请求,转发到 LLM 服务。

目前 LLM 服务为 stub(返回 mock 结果),后续替换为真实代码大模型调用即可。
"""
import time

from fastapi import APIRouter, HTTPException

from src.api.schemas import AnalyzeRequest, AnalyzeResponse, AnalysisMode
from src.services.llm_service import LlmService

router = APIRouter(tags=["analyze"])

# 单例:后续可注入配置(模型名、API key、超时等)
llm = LlmService()


@router.get("/languages")
async def list_languages():
    """返回支持的语言列表(前端下拉框用)。"""
    return {"languages": llm.supported_languages()}


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(req: AnalyzeRequest):
    if req.mode == AnalysisMode.CONVERT and not req.target_language:
        raise HTTPException(
            status_code=400,
            detail="convert 模式需要提供 target_language",
        )
    t0 = time.perf_counter()
    result = await llm.analyze(
        code=req.code,
        language=req.language,
        mode=req.mode,
        target_language=req.target_language,
    )
    elapsed_ms = int((time.perf_counter() - t0) * 1000)
    return AnalyzeResponse(mode=req.mode, result=result, elapsed_ms=elapsed_ms)
