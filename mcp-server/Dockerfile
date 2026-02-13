FROM python:3.12-slim

WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

RUN uv pip install --system "mcp>=1.0.0" "duckdb>=1.0.0"

COPY data/BKSPublic.parquet /app/data/BKSPublic.parquet
COPY mcp-server/server.py .

ENV BKS_PARQUET_PATH=/app/data/BKSPublic.parquet
ENV MCP_TRANSPORT=streamable-http

EXPOSE 8000

CMD ["python", "server.py"]
