import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# Paths
YOLO_WEIGHTS = os.getenv("YOLO_WEIGHTS", str(BASE_DIR / "runs" / "train" / "weights" / "best.pt"))
DB_PATH = os.getenv("DB_PATH", str(BASE_DIR / "app" / "data" / "app.db"))
DATA_DIR = Path(os.getenv("DATA_DIR", str(BASE_DIR / "app" / "data")))
FACES_DIR = DATA_DIR / "faces"
SCANS_DIR = DATA_DIR / "scans"

# Create folders if missing
for p in (DATA_DIR, FACES_DIR, SCANS_DIR):
    p.mkdir(parents=True, exist_ok=True)

# Also ensure DB_PATH directory exists even when DB_PATH is overridden via env
try:
    db_parent = Path(DB_PATH).resolve().parent
    db_parent.mkdir(parents=True, exist_ok=True)
except Exception:
    # Non-fatal: sqlite will still error if path is bad; this just improves DX
    pass
