# Retraining Guide - Improving Model Performance

## Current Issues
- **Low Recall (0.36)**: Model misses 64% of objects
- **Train/Val Same Data**: Your data.yaml uses train images for validation too
- **Only 50 Epochs**: May need more training

## Steps to Improve

### 1. Fix Data Split (CRITICAL)

Edit `data.yaml`:
```yaml
train: ./train/images
val: ./valid/images   # ← Change this
test: ./test/images   # ← Change this

nc: 25
names: ['Aloo curry', 'Bagara rice', ...]
```

If you don't have separate valid/test folders, split your data:
- 70% train
- 20% validation  
- 10% test

### 2. Train Longer with Better Settings

```bash
# Run from: d:\Web Projects\maneesha-project\server\ml models\IOT project

# Option A: More epochs, same model size
python -m ultralytics train model=yolov8n.pt data=data.yaml epochs=150 imgsz=640 batch=8 device=cpu patience=50

# Option B: Larger model (better accuracy, slower)
python -m ultralytics train model=yolov8s.pt data=data.yaml epochs=100 imgsz=640 batch=4 device=cpu

# Option C: Use GPU if available (much faster)
python -m ultralytics train model=yolov8n.pt data=data.yaml epochs=200 imgsz=640 batch=16 device=0
```

### 3. Hyperparameter Tuning

If results are still poor:
```bash
python -m ultralytics train model=yolov8n.pt data=data.yaml epochs=100 lr0=0.001 lrf=0.01
```

### 4. Data Augmentation

Your current training uses good augmentation already, but you can adjust:
- More mosaic augmentation
- Add more training images if available
- Balance classes (ensure all 25 classes have enough samples)

### 5. Check Class Balance

```python
import yaml
from pathlib import Path
from collections import Counter

# Count labels per class
label_dir = Path("train/labels")
class_counts = Counter()

for label_file in label_dir.glob("*.txt"):
    with open(label_file) as f:
        for line in f:
            class_id = int(line.split()[0])
            class_counts[class_id] += 1

# Load class names
with open("data.yaml") as f:
    data = yaml.safe_load(f)
    names = data["names"]

# Print distribution
for class_id, count in sorted(class_counts.items()):
    print(f"{names[class_id]:30s} : {count:4d} samples")
```

If some classes have <50 samples, they'll perform poorly.

### 6. After Retraining

1. New weights will be in: `runs/train2/weights/best.pt` (or train3, train4, etc.)
2. Update your service to use the new weights:
   - Docker: Rebuild with new weights
   - Local: Set `YOLO_WEIGHTS=<path-to-new-best.pt>`
3. Test with validation images
4. Check mAP should be >0.7, recall >0.6

## Quick Validation Test

After training, validate on your test set:
```bash
python -m ultralytics val model=runs/train2/weights/best.pt data=data.yaml
```

Look for:
- mAP50 > 0.7 (good)
- Recall > 0.6 (acceptable)
- Precision > 0.8 (good)

## Expected Training Time

- CPU (your current): 50 epochs ≈ 7 hours
- GPU (NVIDIA): 50 epochs ≈ 20 minutes
- Consider using Google Colab with free GPU if you don't have one

## When Model is Good Enough

You should see:
- Detections on validation images at conf=0.15-0.25
- At least 2-3 items detected in typical food tray images
- Correct class names (not random guesses)
