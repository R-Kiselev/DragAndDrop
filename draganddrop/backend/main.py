import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from python_dotenv import load_dotenv

from .api.router import files
from .api.exceptions import (
    BaseHTTPError,
    base_error_handler,
    internal_exception_handler,
)

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(lifespan=lifespan)


allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "https://draganddrop.live")
allowed_origins_list = [origin.strip() for origin in allowed_origins_str.split(',') if origin.strip()]

if not allowed_origins_list and allowed_origins_str == "https://draganddrop.live": # проверка, если default не был переопределен
    allowed_origins_list = ["https://draganddrop.live"]
elif not allowed_origins_list:
    print("Warning: ALLOWED_ORIGINS is not set or is empty. Defaulting to no origins, which might break CORS.")
    allowed_origins_list = []

print(f"Configuring CORS with allowed origins: {allowed_origins_list}")


app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins_list,  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(files, prefix="/api", tags=["files"])
app.add_exception_handler(BaseHTTPError, base_error_handler)
app.add_exception_handler(500, internal_exception_handler)
