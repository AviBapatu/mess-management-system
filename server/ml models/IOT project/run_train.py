from pathlib import Path
import zipfile
import sys

# Always operate relative to this script's folder so it works no matter
# where you invoke `python run_train.py` from.
BASE_DIR = Path(__file__).resolve().parent


def ensure_unzipped(base_dir: Path, zip_name: str = "fixed_data.yaml.zip") -> None:
    zp = (base_dir / zip_name)
    if zp.exists():
        with zipfile.ZipFile(zp, "r") as z:
            z.extractall(base_dir)
        print(f"✅ Unzipped {zp} -> {base_dir}")
    else:
        print(f"ℹ️ Zip not found next to script: {zp} (skipping unzip)")


def _infer_split_dirs(base_dir: Path) -> tuple[Path, Path, Path]:
    """Return train/val/test image dirs. If val/test are missing, fall back to train.
    This lets training proceed even if only a single split is present.
    """
    train = base_dir / "train" / "images"
    val = base_dir / "val" / "images"
    test = base_dir / "test" / "images"

    if not train.exists():
        raise FileNotFoundError(
            f"Required folder missing: {train}. Please place your dataset under 'train/images' (and labels)."
        )

    if not val.exists():
        print(f"ℹ️ Validation images not found at {val}. Using train images for validation.")
        val = train
    if not test.exists():
        print(f"ℹ️ Test images not found at {test}. Using train images for test.")
        test = train
    return train, val, test


def write_data_yaml(base_dir: Path) -> Path:
    train, val, test = _infer_split_dirs(base_dir)

    # Use POSIX-style relative paths in YAML for portability
    def rel(p: Path) -> str:
        try:
            return p.relative_to(base_dir).as_posix()
        except Exception:
            return p.as_posix()

    content = f"""train: ./{rel(train)}
val: ./{rel(val)}
test: ./{rel(test)}

nc: 25
names: ['Aloo curry', 'Bagara rice', 'Bendakaya fry', 'Boiled egg',
        'Chicken curry', 'Chicken dum biryani', 'Chutney', 'Curd',
        'Dosa', 'Fryums', 'Hot pongal', 'Icecream', 'Lemon water',
        'Mixed vegetable curry', 'Onions', 'Raita', 'Rasam', 'Roti',
        'Roti pachadi', 'Tomato rice', 'Vada', 'Vankaya curry',
        'Watermelon juice', 'White rice', 'sambar']
"""
    p = (base_dir / "data.yaml")
    p.write_text(content, encoding="utf-8")
    print("✅ Wrote:", p.resolve())
    print("Paths in data.yaml ->", {"train": rel(train), "val": rel(val), "test": rel(test)})
    return p


def pick_device():
    try:
        import torch  # type: ignore
        return 0 if torch.cuda.is_available() else 'cpu'
    except Exception:
        return 'cpu'


def main(argv=None):
    print("Script dir:", BASE_DIR)
    print(" CWD      :", Path.cwd())

    ensure_unzipped(BASE_DIR)
    data_yaml = write_data_yaml(BASE_DIR)

    try:
        from ultralytics import YOLO
    except ModuleNotFoundError:
        print(
            "\n[ERROR] Ultralytics not installed in this Python environment.\n"
            "Activate your virtual environment and install requirements, e.g.:\n"
            "  .venv\\Scripts\\activate   (or the venv you use)\n"
            "  pip install -r \"" + str((BASE_DIR / "requirements.txt")) + "\"\n"
            "Then run:\n  python \"" + str((BASE_DIR / "run_train.py")) + "\"\n"
        )
        raise
    model = YOLO("yolov8n.pt")
    device = pick_device()
    print("Using device:", device)

    model.train(
        data=str(data_yaml),
        epochs=50,
        imgsz=640,
        batch=8,
        workers=2,
        project=str(BASE_DIR / "runs"),
        device=device,
    )
    print("✅ Training started. Check the 'runs' folder for outputs.")


if __name__ == "__main__":
    raise SystemExit(main())
