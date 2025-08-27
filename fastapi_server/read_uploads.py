

import os

UPLOAD_DIRECTORY = "./audio_uploads"

def read_uploaded_files():
    print(f"Listing files in: {os.path.abspath(UPLOAD_DIRECTORY)}\n")
    
    if not os.path.exists(UPLOAD_DIRECTORY) or not os.path.isdir(UPLOAD_DIRECTORY):
        print("Upload directory does not exist.")
        return

    files = os.listdir(UPLOAD_DIRECTORY)

    if not files:
        print("No files found in the upload directory.")
        return

    for filename in files:
        print(f"- {filename}")

if __name__ == "__main__":
    read_uploaded_files()

