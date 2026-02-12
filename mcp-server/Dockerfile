FROM python:3.12-slim

WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

COPY mcp-server/pyproject.toml .
RUN uv pip install --system .

COPY data/BKSPublic.parquet /app/data/BKSPublic.parquet
COPY mcp-server/server.py .

ENV BKS_PARQUET_PATH=/app/data/BKSPublic.parquet

CMD ["python", "server.py"]
