"""请求/响应数据模型(Pydantic)。

定义四种分析模式的统一入参,后端按 mode 分发到不同的 LLM 提示词模板。
"""
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


class AnalysisMode(str, Enum):
    EXPLAIN = "explain"      # 解释代码
    BUGS = "bugs"           # 查找 Bug
    TESTS = "tests"          # 生成单元测试
    CONVERT = "convert"     # 代码转语言


class AnalyzeRequest(BaseModel):
    code: str = Field(..., min_length=1, description="待分析的代码片段")
    language: str = Field("auto", description="源代码语言,auto 表示自动识别")
    mode: AnalysisMode
    target_language: Optional[str] = Field(
        None, description="convert 模式下的目标语言"
    )


class AnalyzeResponse(BaseModel):
    mode: AnalysisMode
    result: str = Field(..., description="分析结果(Markdown)")
    elapsed_ms: int = Field(..., description="耗时毫秒")
