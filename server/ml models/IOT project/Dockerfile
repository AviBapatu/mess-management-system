# Base image
FROM python:3.11-slim

# System deps for OpenCV and others
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 libgl1 && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements first for caching
COPY service-requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r service-requirements.txt

# Copy app code
COPY app ./app
COPY runs ./runs

# Default envs (can be overridden at runtime)
ENV YOLO_WEIGHTS="/app/runs/train/weights/best.pt"
ENV DB_PATH="/app/app/data/app.db"

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
