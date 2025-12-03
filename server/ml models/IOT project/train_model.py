"""
Simple training script for YOLOv8 food detection model.
Run from: d:\\Web Projects\\maneesha-project\\server\\ml models\\IOT project

Usage:
    python train_model.py
"""
from ultralytics import YOLO
import torch

# Check GPU availability
print(f"CUDA available: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"GPU: {torch.cuda.get_device_name(0)}")
    print(f"GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f} GB")
    DEVICE = 0
    BATCH = 4
else:
    print("⚠️  No CUDA GPU detected - falling back to CPU")
    print("Training will be MUCH slower (~20 hours vs 40 minutes)")
    DEVICE = 'cpu'
    BATCH = 8

# Configuration optimized for MX550 2GB
MODEL = "yolov8n.pt"  # Nano model - best for 2GB GPU
DATA = "data.yaml"
EPOCHS = 200
IMGSZ = 640
WORKERS = 2  # Data loading workers

print(f"\nStarting training with {EPOCHS} epochs...")
print(f"Model: {MODEL}")
print(f"Data: {DATA}")
print(f"Batch size: {BATCH}")
print(f"Device: {DEVICE}")

# Load a model
model = YOLO(MODEL)

# Train the model
try:
    results = model.train(
        data=DATA,
        epochs=EPOCHS,
        imgsz=IMGSZ,
        batch=BATCH,
        device=DEVICE,
        workers=WORKERS,
        patience=50,  # Early stopping patience
        save=True,
        project="runs",
        name="train",
        exist_ok=True,  # Overwrite if exists
        pretrained=True,
        optimizer="auto",
        verbose=True,
        lr0=0.01,
        lrf=0.01,
        amp=True,  # Automatic Mixed Precision for memory efficiency
        cache=False,  # Don't cache images (saves GPU memory)
    )

    print("\n✅ Training complete!")
    print(f"Best weights: {results.save_dir}/weights/best.pt")
    print(f"Last weights: {results.save_dir}/weights/last.pt")
    print(f"\nTo use the new model, restart your ML service.")
    
except RuntimeError as e:
    if "out of memory" in str(e).lower():
        print("\n❌ GPU ran out of memory!")
        print("Solutions:")
        print("1. Reduce BATCH to 2: BATCH = 2")
        print("2. Reduce image size: IMGSZ = 416")
        print("3. Use CPU: DEVICE = 'cpu'")
    else:
        raise

