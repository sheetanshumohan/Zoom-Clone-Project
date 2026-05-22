import logging
import os
import traceback
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

# Load env variables at the very top of file
load_dotenv()

from database import create_tables, SessionLocal, get_db
import models  # noqa: F401 — register ORM models before create_tables()
from routers.meetings import router as meetings_router
from routers.participants import router as participants_router
from routers.websocket import router as websocket_router
# from services.seed import seed_database

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("main")

# Initialize FastAPI App
app = FastAPI(
    title="Zoom Clone API",
    description="Backend API for Zoom Clone video conferencing app",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Policy configuration
allow_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    os.getenv("FRONTEND_URL", "http://localhost:3000"),
    # Add production frontend URL here when deploying
]
# Remove duplicates
allow_origins = list(set(allow_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Custom HTTP Middleware to append response headers for all routes
@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    if request.method == "OPTIONS":
        from fastapi.responses import Response
        response = Response(status_code=204)
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PATCH, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        return response

    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"  # (dev only)
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PATCH, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response

# Startup Lifecycle Event
@app.on_event("startup")
def on_startup():
    logger.info("Initializing database tables...")
    create_tables()
    
    # logger.info("Checking database seed...")
    # db = SessionLocal()
    # try:
    #     seed_database(db)
    # except Exception as e:
    #     logger.error(f"Error during database seed: {str(e)}")
    # finally:
    #     db.close()
        
    logger.info("Zoom Clone API started successfully")

# Include Router Modules
app.include_router(meetings_router)
app.include_router(participants_router)
app.include_router(websocket_router)

# Base routes
@app.get("/")
def read_root():
    return {
        "message": "Zoom Clone API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    """
    Checks connection integrity to SQLite database with simple text query.
    """
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected"
        }
    except Exception as e:
        logger.error(f"Database health check failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection failed"
        )

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception caught on request {request.url}: {str(exc)}")
    logger.error(traceback.format_exc())
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )

if __name__ == "__main__":
    import uvicorn
    # reload=False avoids orphaned reloader processes stacking on port 8000
    reload = os.getenv("DEV_RELOAD", "").lower() in ("1", "true", "yes")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=reload)
