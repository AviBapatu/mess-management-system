from __future__ import annotations
import math
from pathlib import Path
from typing import Optional, Tuple, List, Dict

import numpy as np
from deepface import DeepFace
from PIL import Image

from .config import FACES_DIR


def save_image(file_bytes: bytes, out_dir: Path, filename: str) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    p = out_dir / filename
    with open(p, 'wb') as f:
        f.write(file_bytes)
    return p


def preload_model(model_name: str = 'Facenet512'):
    print(f"Preloading {model_name}...")
    DeepFace.build_model(model_name=model_name)
    print(f"{model_name} preloaded.")


def compute_embedding(image_path: Path, model_name: str = 'Facenet512') -> List[float]:
    reps = DeepFace.represent(img_path=str(image_path), model_name=model_name, enforce_detection=False)
    if isinstance(reps, list) and len(reps) > 0:
        emb = reps[0]['embedding']
    else:
        raise RuntimeError("Failed to compute face embedding")
    return [float(x) for x in emb]


def cosine_distance(a: List[float], b: List[float]) -> float:
    va = np.asarray(a, dtype=np.float32)
    vb = np.asarray(b, dtype=np.float32)
    num = float(np.dot(va, vb))
    denom = float(np.linalg.norm(va) * np.linalg.norm(vb) + 1e-8)
    if denom == 0:
        return 1.0
    return 1.0 - (num / denom)


def best_match(embedding: List[float], known: List[Dict], threshold: float = 0.30) -> Tuple[Optional[int], Optional[str], float]:
    """Return (user_id, name, distance). If best distance > threshold, return (None, None, best_dist)."""
    best = (None, None, 1.0)
    for item in known:
        dist = cosine_distance(embedding, item['embedding'])
        if dist < best[2]:
            best = (item['user_id'], item['name'], dist)
    if best[0] is None or best[2] > threshold:
        return None, None, best[2]
    return best
