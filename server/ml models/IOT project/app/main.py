from __future__ import annotations
from io import BytesIO
from pathlib import Path
from typing import Any, Dict

from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel

from .face import save_image, compute_embedding
from .inference import FoodDetector
from .config import YOLO_WEIGHTS

app = FastAPI(title="Food & Face Service (stateless)")

detector = FoodDetector()


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


class FoodDetectResponse(BaseModel):
    items: list


@app.post("/food/detect", response_model=FoodDetectResponse)
async def food_detect(food_image: UploadFile = File(...), conf: float = 0.15):
    """Detect food items in an image. Lower conf threshold detects more objects (may include false positives)."""
    if not (food_image.content_type and food_image.content_type.startswith("image/")):
        raise HTTPException(status_code=400, detail="food_image must be an image")
    data = await food_image.read()
    res = detector.predict(data, conf=conf)
    return FoodDetectResponse(items=res.get("items", []))


class AnalyzeResponse(BaseModel):
    embedding: list[float] | None
    food_items: list


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze(food_image: UploadFile = File(...), face_image: UploadFile = File(...), conf: float = 0.15):
    """Analyze food and face images. Returns detected food items and face embedding. Adjust conf to control detection sensitivity."""
    if not (food_image.content_type and food_image.content_type.startswith("image/")):
        raise HTTPException(status_code=400, detail="food_image must be an image")
    if not (face_image.content_type and face_image.content_type.startswith("image/")):
        raise HTTPException(status_code=400, detail="face_image must be an image")
    food_bytes = await food_image.read()
    face_bytes = await face_image.read()

    # Compute outputs
    food_res = detector.predict(food_bytes, conf=conf)
    tmp_path = save_image(face_bytes, Path("/tmp"), f"face_{face_image.filename or 'upload'}.jpg")
    emb = compute_embedding(tmp_path)

    return AnalyzeResponse(embedding=emb, food_items=food_res.get("items", []))


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}


@app.get("/model/info")
async def model_info():
    names = detector.names
    # Provide minimal model info to help debugging
    return {
        "weights_env": YOLO_WEIGHTS,
        "num_classes": len(names),
        "classes": list(names.values())[:50],
    }


@app.post("/debug/detect")
async def debug_detect(food_image: UploadFile = File(...)):
    """Debug endpoint: tries multiple confidence thresholds and returns all results."""
    if not (food_image.content_type and food_image.content_type.startswith("image/")):
        raise HTTPException(status_code=400, detail="food_image must be an image")
    
    data = await food_image.read()
    thresholds = [0.01, 0.05, 0.10, 0.15, 0.20, 0.25, 0.30]
    results = {}
    
    for thresh in thresholds:
        res = detector.predict(data, conf=thresh)
        results[f"conf_{thresh}"] = {
            "count": len(res.get("items", [])),
            "items": res.get("items", [])
        }
    
    return {
        "model_classes": list(detector.names.values())[:10],
        "results_by_threshold": results
    }
