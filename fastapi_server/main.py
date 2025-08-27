
import uvicorn
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os

app = FastAPI()

# Allow requests from the Node.js frontend
origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIRECTORY = "./audio_uploads"

if not os.path.exists(UPLOAD_DIRECTORY):
    os.makedirs(UPLOAD_DIRECTORY)

@app.post("/upload-audio/")
async def upload_audio(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIRECTORY, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"filename": file.filename, "content_type": file.content_type}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)
