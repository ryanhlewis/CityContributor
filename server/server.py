"""
app.py

A FastAPI server that hosts datasets in a local folder and manages a JSON index.

Endpoints:
  1) POST /api/uploadDataset        (Upload a new dataset - City Admin)
  2) PATCH /api/dataset            (Edit a dataset's title/description - City Admin)
  3) DELETE /api/dataset/{id}      (Delete a dataset - City Admin)
  4) POST /api/contribute          (User registers as a known contributor, verifying file)
  5) GET /api/datasets             (List all current datasets for front-end)
     * Once a dataset has 5 verified contributors, the original file is deleted.
"""

import os
import json
import time
import hashlib
import requests
import random
from typing import Optional, List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Body, Request
from fastapi.responses import JSONResponse, FileResponse, RedirectResponse
from pydantic import BaseModel
from pathlib import Path

# -- CORS IMPORT --
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Allow all CORS origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------- CONFIG --------------
DATA_DIR = Path("data")
DATASETS_FOLDER = DATA_DIR / "datasets"
DATASETS_JSON = DATA_DIR / "datasets.json"
CONTRIB_JSON = DATA_DIR / "contributors.json"

# Make sure directories exist
DATA_DIR.mkdir(exist_ok=True)
DATASETS_FOLDER.mkdir(exist_ok=True)

# -------------- MODELS --------------
class Dataset(BaseModel):
    id: str
    title: str
    description: str
    hash: str
    verifiedContributorHosts: int
    originalFilename: str
    filenameOnDisk: str  # The actual filename we store locally (includes extension)

class Contributor(BaseModel):
    datasetId: str
    name: str
    email: str
    hostLink: str


# -------------- UTILS --------------
def compute_sha256(file_bytes: bytes) -> str:
    """Compute SHA-256 hex digest of given bytes."""
    return hashlib.sha256(file_bytes).hexdigest()

def load_datasets() -> List[Dataset]:
    """Load datasets from local datasets.json."""
    if not DATASETS_JSON.exists():
        return []
    with open(DATASETS_JSON, "r", encoding="utf-8") as f:
        arr = json.load(f)
        return [Dataset(**item) for item in arr]

def save_datasets(datasets: List[Dataset]) -> None:
    """Save datasets to local datasets.json."""
    with open(DATASETS_JSON, "w", encoding="utf-8") as f:
        json.dump([d.dict() for d in datasets], f, indent=2)

def load_contributors() -> List[Contributor]:
    """Load contributors from local contributors.json."""
    if not CONTRIB_JSON.exists():
        return []
    with open(CONTRIB_JSON, "r", encoding="utf-8") as f:
        arr = json.load(f)
        return [Contributor(**item) for item in arr]

def save_contributors(contribs: List[Contributor]) -> None:
    """Save contributors to local contributors.json."""
    with open(CONTRIB_JSON, "w", encoding="utf-8") as f:
        json.dump([c.dict() for c in contribs], f, indent=2)

def find_dataset_by_id(dataset_id: str, datasets: List[Dataset]) -> Optional[Dataset]:
    """Helper to find a dataset from the list by ID."""
    return next((d for d in datasets if d.id == dataset_id), None)

def delete_local_file(filename_on_disk: str):
    """Delete the local file for a dataset if it exists."""
    file_path = DATASETS_FOLDER / filename_on_disk
    if file_path.exists():
        file_path.unlink()


# -------------- ROUTES --------------

@app.get("/api/datasets")
def get_all_datasets():
    """
    Get the list of all datasets (metadata only).
    The front-end can use this to display available datasets.
    """
    datasets = load_datasets()
    return [d.dict() for d in datasets]


@app.post("/api/uploadDataset")
async def upload_dataset(
    title: str = Form(...),
    description: str = Form(...),
    file: UploadFile = File(...)
):
    """
    City Admin uploads a new dataset (multipart/form-data).
    - Compute the unique dataset_id
    - Preserve the original file extension
    - Save to local data/datasets/filenameOnDisk
    - Compute hash
    - Add to datasets.json
    """
    if not title.strip():
        raise HTTPException(status_code=400, detail="Title is required.")
    if not description.strip():
        raise HTTPException(status_code=400, detail="Description is required.")

    # Read entire file contents
    file_bytes = await file.read()

    # Compute a unique dataset_id
    dataset_id = f"{title.lower().replace(' ', '-')}-{int(time.time())}"

    # Extract the original extension (if any)
    original_extension = Path(file.filename).suffix or ""
    if not original_extension:
        # If there's no extension, you might decide how to handle; here we do nothing special
        original_extension = ""

    # We'll store the file as <dataset_id><original_extension>
    filename_on_disk = f"{dataset_id}{original_extension}"

    # Save the file locally
    dataset_path = DATASETS_FOLDER / filename_on_disk
    with open(dataset_path, "wb") as out_f:
        out_f.write(file_bytes)

    # Compute hash of uploaded bytes
    file_hash = compute_sha256(file_bytes)

    new_dataset = Dataset(
        id=dataset_id,
        title=title,
        description=description,
        hash=file_hash,
        verifiedContributorHosts=0,
        originalFilename=file.filename or f"{dataset_id}{original_extension}",
        filenameOnDisk=filename_on_disk
    )

    # Append to our list of datasets
    datasets = load_datasets()
    datasets.append(new_dataset)
    save_datasets(datasets)

    return {
        "message": "Dataset uploaded successfully.",
        "dataset": new_dataset.dict()
    }


@app.patch("/api/dataset")
def edit_dataset(body: dict = Body(...)):
    """
    City Admin can edit a dataset's title or description.
    Expect JSON: { id: string, title?: string, description?: string }
    """
    dataset_id = body.get("id")
    if not dataset_id:
        raise HTTPException(status_code=400, detail="Missing dataset id")

    new_title = body.get("title")
    new_desc = body.get("description")

    datasets = load_datasets()
    ds = find_dataset_by_id(dataset_id, datasets)
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")

    if new_title is not None:
        ds.title = new_title
    if new_desc is not None:
        ds.description = new_desc

    # Save changes back
    # (Replace the old dataset object in the list)
    for i, item in enumerate(datasets):
        if item.id == dataset_id:
            datasets[i] = ds
            break

    save_datasets(datasets)
    return {"message": "Dataset updated"}


@app.delete("/api/dataset/{dataset_id}")
def delete_dataset(dataset_id: str):
    """
    City Admin deletes a dataset:
      - Remove from datasets.json
      - Delete the local file if it exists
    """
    datasets = load_datasets()
    ds = find_dataset_by_id(dataset_id, datasets)
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")

    # Remove from the list
    updated = [d for d in datasets if d.id != dataset_id]

    # Delete the local file
    delete_local_file(ds.filenameOnDisk)

    # Save updated list to JSON
    save_datasets(updated)

    return {"message": f"Dataset {dataset_id} deleted"}


@app.post("/api/contribute")
def contribute(body: dict = Body(...)):
    """
    A user registers as a known contributor for a dataset.
    Expect JSON: { datasetId, name, email, hostLink }
    Steps:
      1) Verify dataset exists
      2) Download hostLink, compute hash, compare
      3) If valid, add to contributors.json
      4) Increase dataset's verifiedContributorHosts
      5) If verifiedContributorHosts >= 5, delete local file
    """
    dataset_id = body.get("datasetId")
    name = body.get("name")
    email = body.get("email")
    host_link = body.get("hostLink")

    if not all([dataset_id, name, email, host_link]):
        raise HTTPException(status_code=400, detail="Missing fields")

    datasets = load_datasets()
    ds = find_dataset_by_id(dataset_id, datasets)
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")

    try:
        r = requests.get(host_link, timeout=10)
        r.raise_for_status()
        hosted_bytes = r.content
        hosted_hash = compute_sha256(hosted_bytes)
        if hosted_hash != ds.hash:
            raise HTTPException(status_code=400, detail="File hash mismatch.")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error fetching contributor file: {str(e)}")

    contributors = load_contributors()
    # Check if this exact user (by email) is already a contributor for that dataset
    existing = [c for c in contributors if c.datasetId == dataset_id and c.email == email]
    if not existing:
        new_c = Contributor(
            datasetId=dataset_id,
            name=name,
            email=email,
            hostLink=host_link
        )
        contributors.append(new_c)
        save_contributors(contributors)

    # Recompute count of verified contributors for this dataset
    verified_for_ds = [c for c in contributors if c.datasetId == dataset_id]
    ds.verifiedContributorHosts = len(verified_for_ds)

    # Update the dataset list
    for i, d in enumerate(datasets):
        if d.id == dataset_id:
            datasets[i] = ds
            break
    save_datasets(datasets)

    # If enough contributors, delete local file
    if ds.verifiedContributorHosts >= 5:
        delete_local_file(ds.filenameOnDisk)

    return {"message": "Contributor verified and saved"}

@app.get("/api/files/{dataset_id}")
def download_file(dataset_id: str):
    """
    Return the original file for the dataset (if it still exists).
    If the file was already deleted (i.e., after 5 contributors),
    return a random contributor's link instead of 404.
    """
    datasets = load_datasets()
    ds = find_dataset_by_id(dataset_id, datasets)
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")

    file_path = DATASETS_FOLDER / ds.filenameOnDisk

    # Check if we still have the file on disk
    if file_path.exists():
        # Return the file directly
        return FileResponse(
            path=file_path,
            media_type="application/octet-stream",
            filename=ds.originalFilename
        )
    else:
        # File is gone (likely deleted after reaching 5 contributors)
        # Return a random contributor link
        all_contributors = load_contributors()
        ds_contributors = [c for c in all_contributors if c.datasetId == dataset_id]

        if not ds_contributors:
            # No local file AND no contributors found => cannot provide anything
            raise HTTPException(
                status_code=404, 
                detail="No local file and no known contributor link."
            )

        # Pick a random link from among the dataset's contributors
        random_contrib = random.choice(ds_contributors)
        return RedirectResponse(url=random_contrib.hostLink, status_code=302)

    
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8005, reload=True)
