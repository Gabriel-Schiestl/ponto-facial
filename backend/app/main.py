import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import face
from .config import CORS_ORIGINS, DATA_DIR
from .database import Base, engine
from .routers import funcionarios, ponto

logging.basicConfig(level=logging.INFO)


@asynccontextmanager
async def lifespan(_: FastAPI):
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    Base.metadata.create_all(engine)
    face.warmup()
    yield


app = FastAPI(title="Ponto Facial", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(funcionarios.router)
app.include_router(ponto.router)


@app.get("/api/saude", tags=["sistema"])
def health():
    return {"status": "ok"}
