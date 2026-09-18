import re
import tempfile
from pathlib import Path

import imageio_ffmpeg
import yt_dlp
from fastapi import FastAPI, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

FFMPEG_PATH = imageio_ffmpeg.get_ffmpeg_exe()

app = FastAPI(title="VoidForge YT to MP3")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://voidforgestudios272.github.io",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=False,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

YOUTUBE_HOSTS = {
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
    "youtu.be",
    "www.youtube-nocookie.com",
}


def is_youtube_url(url: str) -> bool:
    match = re.match(r"^https?://([^/]+)(?:/|$)", url, re.IGNORECASE)
    if not match:
        return False
    return match.group(1).lower().split(":")[0] in YOUTUBE_HOSTS


@app.get("/")
def health():
    return {"status": "ok", "service": "VoidForge YT to MP3"}


@app.post("/download")
def download(url: str = Form(...)):
    url = url.strip()
    if not is_youtube_url(url):
        raise HTTPException(status_code=400, detail="Please enter a valid YouTube URL.")

    temp_dir = tempfile.mkdtemp(prefix="yttomp3-")
    output = Path(temp_dir) / "audio.%(ext)s"

    options = {
        "format": "bestaudio/best",
        "outtmpl": str(output),
        "noplaylist": True,
        "quiet": True,
        "no_warnings": True,
        "ffmpeg_location": FFMPEG_PATH,
        "js_runtimes": {
            "node": {},
        },
        "postprocessors": [
            {
                "key": "FFmpegExtractAudio",
                "preferredcodec": "mp3",
                "preferredquality": "192",
            }
        ],
    }

    try:
        with yt_dlp.YoutubeDL(options) as ydl:
            ydl.download([url])

        mp3_path = Path(temp_dir) / "audio.mp3"
        if not mp3_path.exists():
            raise HTTPException(status_code=500, detail="MP3 conversion failed.")

        return FileResponse(
            path=mp3_path,
            media_type="audio/mpeg",
            filename="audio.mp3",
        )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Conversion failed: {exc}")
