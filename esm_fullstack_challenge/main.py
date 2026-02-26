from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from esm_fullstack_challenge import __version__
from esm_fullstack_challenge.routers import basic_router, dashboard_router, \
    drivers_router, races_router, auth_router
from esm_fullstack_challenge.config import CORS_ORIGINS, DB_FILE
from esm_fullstack_challenge.db import DB


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown events."""
    # Startup: ensure database indexes exist
    db = DB(DB_FILE)
    db.ensure_indexes()
    yield
    # Shutdown: cleanup if needed


app = FastAPI(title="F1 DATA API", version=__version__, lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in CORS_ORIGINS.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


@app.get("/")
def root():
    return {
        'name': app.title,
        'version': app.version,
    }


@app.get("/ping")
def ping():
    return {"ping": "pong"}


app.include_router(auth_router, prefix='/auth', tags=['Auth'])
app.include_router(basic_router, prefix='', tags=['Basic'])
app.include_router(drivers_router, prefix='/drivers', tags=['Drivers'])
app.include_router(races_router, prefix='/races', tags=['Races'])
app.include_router(dashboard_router, prefix='/dashboard', tags=['Dashboard'])
