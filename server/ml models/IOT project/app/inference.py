from __future__ import annotations
from pathlib import Path
from typing import List, Dict, Any
from io import BytesIO

import numpy as np
from PIL import Image

from ultralytics import YOLO

from .config import YOLO_WEIGHTS


class FoodDetector:
    def __init__(self, weights: str | None = None):
        w = weights or YOLO_WEIGHTS
        w_path = Path(w)
        if w_path.exists():
            print(f"[FoodDetector] Loading YOLO weights: {w_path}")
            self.model = YOLO(str(w_path))
        else:
            print(
                f"[FoodDetector] WARNING: weights not found at {w_path}. Falling back to 'yolov8n.pt' (COCO)."
            )
            self.model = YOLO('yolov8n.pt')
        self._names = None
        # Log model info on init
        names = self.names
        print(f"[FoodDetector] Model loaded with {len(names)} classes: {list(names.values())[:10]}...")

    @property
    def names(self) -> Dict[int, str]:
        if self._names is None:
            # names mapping is attached per-result too, but cache from model
            self._names = self.model.model.names if hasattr(self.model, 'model') else {}
        return self._names or {}

    def predict(self, image_bytes: bytes, conf: float = 0.15, imgsz: int = 640) -> Dict[str, Any]:
        img = Image.open(BytesIO(image_bytes)).convert('RGB')
        print(f"[FoodDetector] Running prediction: conf={conf}, imgsz={imgsz}, img_size={img.size}")
        res = self.model.predict(source=np.array(img), conf=conf, imgsz=imgsz, verbose=False)
        if not res:
            print("[FoodDetector] WARNING: No results returned from model.predict()")
            return {"items": []}
        r = res[0]
        total_boxes = len(r.boxes) if hasattr(r, 'boxes') else 0
        print(f"[FoodDetector] Detected {total_boxes} boxes")
        items = []
        names = r.names if hasattr(r, 'names') else self.names
        if not names:
            # Log once per process if names mapping missing
            print("[FoodDetector] WARNING: Model class names mapping is empty; predictions may show numeric class IDs.")
        for b in r.boxes:
            cls_id = int(b.cls[0]) if hasattr(b, 'cls') else -1
            confv = float(b.conf[0]) if hasattr(b, 'conf') else 0.0
            xyxy = b.xyxy[0].tolist() if hasattr(b, 'xyxy') else None
            class_name = names.get(cls_id, str(cls_id))
            print(f"  - class_id={cls_id}, class_name={class_name}, conf={confv:.3f}")
            items.append({
                "class_id": cls_id,
                "class_name": class_name,
                "confidence": confv,
                "bbox_xyxy": xyxy,
            })
        return {"items": items}
