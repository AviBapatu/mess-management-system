from __future__ import annotations
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel

from contextlib import asynccontextmanager
from .face import save_image, compute_embedding, preload_model

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load model on startup
    try:
        preload_model()
    except Exception as e:
        print(f"Warning: Failed to preload model: {e}")
    yield

app = FastAPI(title="Face Service (stateless)", lifespan=lifespan)

class EmbeddingResponse(BaseModel):
    embedding: list[float]


@app.post("/face/embedding", response_model=EmbeddingResponse)
async def face_embedding(face_image: UploadFile = File(...)):
    if not (face_image.content_type and face_image.content_type.startswith("image/")):
        raise HTTPException(status_code=400, detail="face_image must be an image")
    data = await face_image.read()
    # Persist optional temp if you want; not required for embedding
    tmp_path = save_image(data, Path("/tmp"), f"face_{face_image.filename or 'upload'}.jpg")
    emb = compute_embedding(tmp_path)
    return EmbeddingResponse(embedding=emb)


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

