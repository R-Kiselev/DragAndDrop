from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.router import files
from .api.exceptions import (
    BaseHTTPError,
    base_error_handler,
    internal_exception_handler,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(lifespan=lifespan)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(files, prefix="/api", tags=["files"])
app.add_exception_handler(BaseHTTPError, base_error_handler)
app.add_exception_handler(500, internal_exception_handler)
