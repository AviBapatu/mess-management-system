# Sharing Your YOLOv8 Food Detection Training Code

## What to Share

To enable others to reproduce your training, share these files:

### 1. **Training Code** ✅
```
train_model.py                    # Main training script
training-requirements.txt         # Python dependencies
```

### 2. **Dataset Configuration** ✅
```
data.yaml                         # Class names and dataset paths
```

### 3. **Documentation** ✅
```
README.md                         # Quick start guide
RETRAINING_GUIDE.md              # Detailed training instructions
```

### 4. **Dataset** (Choose one option)

**Option A: Share the Full Dataset** (Best for reproducibility)
```
train/
  ├── images/          # All training images
  └── labels/          # YOLO format annotations
valid/ (if you have it)
  ├── images/
  └── labels/
README.dataset.txt     # Roboflow export info
```

**Option B: Share Roboflow Link** (Easier, smaller)
- Share your Roboflow project link
- Others can download the same dataset in YOLOv8 format
- Example: `https://universe.roboflow.com/your-workspace/your-project`

**Option C: Don't Share Dataset** (Only code)
- Provide instructions on how to get similar data
- Document the expected format
- Others use their own food images

---

## Recommended Sharing Methods

### Method 1: GitHub Repository (Best)

**Create a public repo with:**
```
your-food-detection/
├── train_model.py
├── training-requirements.txt
├── data.yaml
├── README.md
├── RETRAINING_GUIDE.md
├── .gitignore              # Exclude large files
└── dataset/                # Optional: include sample images
    └── README.md           # Dataset download instructions
```

**.gitignore example:**
```gitignore
# Exclude large files
*.pt
*.pth
runs/
train/images/
train/labels/
valid/
test/
*.zip

# Python
__pycache__/
*.pyc
.venv/
venv/
*.egg-info/

# IDE
.vscode/
.idea/
*.swp
```

**README.md should include:**
- Dataset source/link
- Installation steps
- Training command
- Expected results
- Hardware requirements

### Method 2: ZIP File

**Create a ZIP with:**
```
food-detection-training.zip
├── train_model.py
├── training-requirements.txt  
├── data.yaml
├── README.md
├── RETRAINING_GUIDE.md
└── sample_results/
    ├── results.csv
    └── confusion_matrix.png
```

**Exclude from ZIP:**
- Actual images (too large)
- Model weights (too large)
- Virtual environment (.venv/)
- Cache files (__pycache__/)

Provide **separate download link** for dataset (Google Drive, Dropbox, etc.)

### Method 3: Kaggle/Google Colab Notebook

**Convert to notebook format:**
- Create Jupyter notebook with:
  - Installation cells
  - Data loading code
  - Training code
  - Visualization
- Upload to Kaggle Datasets with your images
- Share public link

---

## Minimal Sharing Package (Smallest)

If you only want to share the **code** (not dataset):

```
📦 Share These 3 Files:
├── train_model.py              (2 KB)
├── training-requirements.txt   (1 KB)  
└── QUICK_START.md             (3 KB)
```

**QUICK_START.md template:**
```markdown
# Quick Start

## 1. Get Dataset
Download YOLOv8 format food dataset from Roboflow:
- Format: YOLOv8
- Annotation: Object Detection
- Place in: `./train/` and `./valid/`

## 2. Install
pip install -r training-requirements.txt
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121

## 3. Train
python train_model.py

## 4. Results
Trained model: `runs/train/weights/best.pt`
```

---

## Full Sharing Checklist

**Mandatory:**
- [ ] `train_model.py` - Training script
- [ ] `training-requirements.txt` - Dependencies
- [ ] `README.md` - Setup instructions
- [ ] `data.yaml` - Class names (without full paths)

**Recommended:**
- [ ] `RETRAINING_GUIDE.md` - Detailed guide
- [ ] `.gitignore` - If using Git
- [ ] Sample training results (CSV, plots)
- [ ] Pre-trained weights link (optional)

**Optional:**
- [ ] Full dataset (or download link)
- [ ] Jupyter notebook version
- [ ] Docker setup
- [ ] Inference examples

---

## Example GitHub README Template

```markdown
# YOLOv8 Food Detection Training

Train a YOLOv8 model to detect 25 Indian food items.

## Quick Start
```bash
# 1. Install
pip install -r training-requirements.txt
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121

# 2. Download dataset
# [Provide Roboflow link or instructions]

# 3. Train
python train_model.py
```

## Dataset
- 25 food classes: Aloo curry, Dosa, Roti, etc.
- Format: YOLOv8
- Source: [Roboflow link] OR [Your own collection]

## Requirements
- GPU: 2GB+ VRAM (NVIDIA)
- Python 3.8+
- Training time: ~40 min (GPU) or ~20 hrs (CPU)

## Results
Expected mAP50: >0.70 after 200 epochs

## Citation
[Add if using public dataset]
```

---

## What NOT to Share

❌ **Don't include:**
- Virtual environment folders (`.venv/`, `venv/`)
- Large model files (`.pt` files) - share download link instead
- Cache files (`__pycache__/`, `.ipynb_checkpoints/`)
- Personal API keys or credentials
- Absolute file paths (use relative paths)

---

## Summary

**Minimum to share:**
1. `train_model.py`
2. `training-requirements.txt`
3. Short README with dataset instructions

**Best practice:**
- GitHub repo with code + docs
- Separate dataset download link
- Sample results for verification
- Clear hardware requirements

Choose the method that fits your audience and dataset size!
