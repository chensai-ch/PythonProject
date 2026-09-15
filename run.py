"""启动入口:python run.py

直接运行即可启动 FastAPI + uvicorn 服务,默认 http://127.0.0.1:8000
"""
import uvicorn


def main():
    uvicorn.run(
        "src.app:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        reload_dirs=["src"],
    )


if __name__ == "__main__":
    main()
