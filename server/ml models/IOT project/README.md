# Food Project (YOLOv8)

A cleaned-up, local-first version of the original Colab notebook to train a YOLOv8 model using Ultralytics.

## Project layout

- `Food_project.ipynb` — Notebook ready to run locally (no Colab-only calls)
- `run_train.py` — Script to run training headlessly from the terminal
- `requirements.txt` — Minimal dependencies for training/notebooks
- `fixed_data.yaml.zip` — Archive you provided (unzipped at runtime if present)
- `app/` — Service code ready to be dockerized (FastAPI, YOLOv8 inference, DeepFace face enroll/match)
- `service-requirements.txt` — Minimal dependencies for the service container
- `Dockerfile` — Build a container exposing the API on port 8000

## Expected dataset layout

Ultralytics expects the YOLO format. By default, this project writes a `data.yaml` pointing to relative paths:

```
train: ./train/images
val: ./val/images
test: ./test/images
```

Under each of `train`, `val`, and `test`, place corresponding `images/` and `labels/` folders. Labels are text files in YOLO format. Example:

```
project/
  train/
    images/
      img1.jpg
      img2.jpg
    labels/
      img1.txt
      img2.txt
  val/
    images/
    labels/
  test/
    images/
    labels/
```

If your archive already contains a `data.yaml` and a dataset, you can either use it directly or let the provided code overwrite `data.yaml` with the relative paths above.

## Quick start (Windows, cmd.exe)

1. Open Command Prompt and switch to the project directory:

   ```cmd
   cd /d "d:\python\IOT project\IOT project"
   ```

2. Create and activate a virtual environment, then install deps:

   ```cmd
   python -m venv .venv
   .venv\Scripts\activate
   python -m pip install --upgrade pip
   pip install -r requirements.txt
   ```

   If you have an NVIDIA GPU and want acceleration, install a CUDA-enabled PyTorch build before training. See https://pytorch.org for the correct command for your setup.

3. Run training via script (unzips the archive, writes `data.yaml`, starts training):

   ```cmd
   python run_train.py
   ```

   Outputs will be under a `runs` folder.

## Run the API locally (no Docker)

In a separate environment (or reuse the same):

```cmd
cd /d "d:\python\IOT project\IOT project"
python -m venv .venv-api
.venv-api\Scripts\activate
pip install --upgrade pip
pip install -r service-requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Endpoints:
- POST `/register` form-data: `name` + file `face_image`
- POST `/scan` form-data: file `food_image` + file `face_image`
- GET `/healthz`

By default the API looks for YOLO weights at `runs/train/weights/best.pt`. Override with env `YOLO_WEIGHTS`.

## Docker

Build and run:

```cmd
cd /d "d:\python\IOT project\IOT project"
docker build -t food-face-service .
docker run --rm -p 8000:8000 -e YOLO_WEIGHTS=/app/runs/train/weights/best.pt food-face-service
```

Open http://localhost:8000/docs for interactive API docs.

## Running the notebook

- Open `Food_project.ipynb` in VS Code or Jupyter and ensure the kernel uses the `.venv` interpreter you created.
- Run cells from top to bottom. The notebook:
  - Prints the working folder
  - Unzips `fixed_data.yaml.zip` if present
  - Creates/overwrites a local `data.yaml` with relative paths
  - Prints `data.yaml`
  - Trains the model (auto-selects GPU if available, otherwise CPU)

## Notes & troubleshooting

- If you see errors about missing images/labels, make sure your dataset follows the expected layout and that `data.yaml` points to the correct folders.
- If model download is blocked by network, download `yolov8n.pt` manually and reference the local path in `run_train.py` and the notebook.
- To force CPU training, set `device='cpu'` in the train call. To use GPU, ensure the correct CUDA-enabled PyTorch is installed; the script will auto-detect if available.

Service-specific:
- The first run of DeepFace and Ultralytics may download model weights; allow internet access on first start.
- If you don’t have `val/` and `test/`, the code will reuse `train/` so you can start immediately.
- Face matching uses cosine distance on Facenet512 embeddings (threshold ~0.30 by default). Adjust in `app/face.py` if needed.
