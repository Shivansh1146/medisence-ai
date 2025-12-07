from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import appointments, chat
from . import models, database

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(
    title="MedicSense AI API",
    description="API for MedicSense AI Healthcare Assistant",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(appointments.router)
app.include_router(chat.router)

@app.get("/")
async def root():
    return {"message": "Welcome to MedicSense AI API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
