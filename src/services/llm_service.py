"""LLM 服务(当前为 stub,后续接入真实代码大模型)。

后续实现方案:
1. 在此处的 analyze() 中调用代码大模型(如 Qwen-Code、DeepSeek-Coder、StarCoder 等);
2. 按 mode 拼装不同 system prompt;
3. 可选流式输出(SSE),前端切换为 EventSource 接收。

替换 stub 时保持本类公开方法签名不变,API 层无需改动。
"""
from typing import Optional

from src.api.schemas import AnalysisMode

# 支持的源/目标语言(前端下拉)
_LANGUAGES = [
    "auto", "Python", "JavaScript", "TypeScript", "Java", "C", "C++",
    "C#", "Go", "Rust", "Ruby", "PHP", "Swift", "Kotlin", "Scala",
    "SQL", "Shell", "HTML", "CSS",
]


class LlmService:
    """代码大模型服务封装。

    当前 stub 行为:按模式返回一段固定格式的 mock Markdown,
    让前端可以独立联调和展示。接入真实模型时替换 analyze() 实现即可。
    """

    @staticmethod
    def supported_languages() -> list[str]:
        return list(_LANGUAGES)

    async def analyze(
        self,
        code: str,
        language: str,
        mode: AnalysisMode,
        target_language: Optional[str] = None,
    ) -> str:
        # --- 后续接入真实 LLM 在此分模式拼 prompt ---
        if mode == AnalysisMode.EXPLAIN:
            return self._mock_explain(code, language)
        if mode == AnalysisMode.BUGS:
            return self._mock_bugs(code, language)
        if mode == AnalysisMode.TESTS:
            return self._mock_tests(code, language)
        if mode == AnalysisMode.CONVERT:
            return self._mock_convert(code, language, target_language or "Python")
        return ""

    # ---- mock 生成(占位,验证前端可用)----
    def _mock_explain(self, code: str, language: str) -> str:
        lines = code.strip().splitlines()
        summary = (
            f"## 代码解释\n\n"
            f"**语言**: {language}\n"
            f"**行数**: {len(lines)}\n\n"
            f"### 功能概述\n"
            f"这是一段 {language or '未识别'} 代码。AI 接入后将在此输出:\n"
            f"- 代码的整体作用\n"
            f"- 关键函数/类的职责\n"
            f"- 算法或数据流说明\n\n"
            f"### 逐行解读\n"
            f"```{language if language != 'auto' else ''}\n{code.strip()}\n```\n\n"
            f"> ⚠️ 当前为 stub 返回,接入代码大模型后会替换为真实分析。"
        )
        return summary

    def _mock_bugs(self, code: str, language: str) -> str:
        return (
            f"## Bug 排查\n\n"
            f"**语言**: {language}\n\n"
            f"### 潜在问题\n"
            f"AI 接入后将逐条列出:\n"
            f"1. ⚠️ [行号] 问题类型 — 描述与修复建议\n"
            f"2. ⚠️ [行号] 问题类型 — 描述与修复建议\n\n"
            f"### 修复后代码\n"
            f"```{language if language != 'auto' else ''}\n// 推荐的修复版本\n```\n\n"
            f"> ⚠️ 当前为 stub 返回。"
        )

    def _mock_tests(self, code: str, language: str) -> str:
        return (
            f"## 单元测试\n\n"
            f"**目标语言**: {language}\n\n"
            f"### 测试用例\n"
            f"AI 接入后将生成覆盖正常/边界/异常路径的测试:\n\n"
            f"```{(language if language != 'auto' else 'python').lower()}\n"
            f"# 自动生成的单元测试\nimport unittest\n\n"
            f"class TestGenerated(unittest.TestCase):\n"
            f"    def test_normal(self):\n"
            f"        self.assertTrue(True)  # TODO: 替换为真实断言\n```\n\n"
            f"> ⚠️ 当前为 stub 返回。"
        )

    def _mock_convert(self, code: str, src: str, dst: str) -> str:
        return (
            f"## 代码转换\n\n"
            f"**{src} → {dst}**\n\n"
            f"### 转换结果\n"
            f"```{dst.lower()}\n# 转换后的 {dst} 代码\n# TODO: 接入 LLM 后输出真实转换\n```\n\n"
            f"### 转换说明\n"
            f"- 语义对应的差异点\n"
            f"- 需要手动调整的惯用法\n\n"
            f"> ⚠️ 当前为 stub 返回。"
        )
