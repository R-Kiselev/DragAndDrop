FROM python:3.13.1-slim AS builder

WORKDIR /build_wheels

ENV PYTHONFAULTHANDLER=1 \
    PYTHONHASHSEED=random \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

COPY requirements.txt .
RUN pip wheel --no-cache-dir --no-deps --wheel-dir /build_wheels/wheels -r requirements.txt


FROM python:3.13.1-slim

WORKDIR /app

COPY --from=builder /build_wheels/wheels /wheels
COPY requirements.txt .

RUN pip install --no-cache /wheels/*

COPY . /app/backend

# COPY ./entrypoint.sh /app/entrypoint.sh # Если он лежит рядом с Dockerfile
# RUN chmod +x /app/entrypoint.sh

ENV PYTHONPATH=/app

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
