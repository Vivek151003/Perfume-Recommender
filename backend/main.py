"""FastAPI backend for the Scentique Perfume Recommender."""
import threading
from pathlib import Path
from contextlib import asynccontextmanager

from dotenv import load_dotenv
load_dotenv(Path(__file__).parent.parent / ".env")

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from agent import PerfumeAgent
import websearch
import currency
from models import (
    ChatRequest,
    ChatResponse,
    RecommendRequest,
    RecommendResponse,
)
from rag import PerfumeRAG
from recommender import ContentBasedRecommender

def _enrich(p: dict) -> dict:
    """Add price_inr and cached image_url to a perfume dict."""
    p["price_inr"] = currency.usd_to_inr(p.get("price_usd"))
    cached = websearch.get_cached_image(p.get("id", ""))
    if cached:
        p["image_url"] = cached
    return p


def _enrich_result(r) -> None:
    """Add price_inr and cached image_url to a PerfumeResult object in-place."""
    r.price_inr = currency.usd_to_inr(r.price_usd)
    cached = websearch.get_cached_image(r.id)
    if cached:
        r.image_url = cached


rag: PerfumeRAG | None = None
recommender: ContentBasedRecommender | None = None
agent: PerfumeAgent | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global rag, recommender, agent
    print("Initialising RAG pipeline...")
    rag = PerfumeRAG()
    print("Initialising content-based recommender...")
    recommender = ContentBasedRecommender()
    print("Initialising Groq agent...")
    agent = PerfumeAgent(rag, recommender)
    print("All systems ready.")
    # Image fetching is now lazy: the first time the UI requests a perfume's
    # image (via /perfumes/{id}/image), it's looked up and cached.
    # Auto-prefetching every perfume is impractical at 2K+ entries.
    yield
    print("Shutting down.")


app = FastAPI(title="Scentique — AI Perfume Recommender", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/currency")
async def get_currency():
    rate = currency.get_usd_to_inr()
    return {"usd_to_inr": round(rate, 2)}


@app.get("/perfumes")
async def list_perfumes():
    if rag is None:
        raise HTTPException(status_code=503, detail="Service starting up")
    perfumes = [_enrich(dict(p)) for p in rag.get_all()]
    return {"perfumes": perfumes, "total": len(perfumes)}


@app.get("/perfumes/{perfume_id}")
async def get_perfume(perfume_id: str):
    if rag is None:
        raise HTTPException(status_code=503, detail="Service starting up")
    perfume = rag.get_by_id(perfume_id)
    if not perfume:
        raise HTTPException(status_code=404, detail="Perfume not found")
    return _enrich(dict(perfume))


@app.get("/perfumes/{perfume_id}/image")
async def get_perfume_image(perfume_id: str):
    """Return an image URL for the perfume (fetches from DuckDuckGo if not cached)."""
    if rag is None:
        raise HTTPException(status_code=503, detail="Service starting up")
    perfume = rag.get_by_id(perfume_id)
    if not perfume:
        raise HTTPException(status_code=404, detail="Perfume not found")

    cached = websearch.get_cached_image(perfume_id)
    if cached:
        return {"url": cached}

    url = websearch.search_perfume_image(perfume_id, perfume["name"], perfume["brand"])
    return {"url": url}


@app.post("/recommend", response_model=RecommendResponse)
async def recommend(request: RecommendRequest):
    if agent is None:
        raise HTTPException(status_code=503, detail="Service starting up")
    try:
        summary, designer, middle_eastern = await agent.get_recommendations(
            request.preferences, top_k=request.top_k
        )
        for r in designer:
            _enrich_result(r)
        for r in middle_eastern:
            _enrich_result(r)
        return RecommendResponse(
            recommendations=designer + middle_eastern,
            designer=designer,
            middle_eastern=middle_eastern,
            summary=summary,
            budget_inr=request.preferences.budget_inr,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    if agent is None:
        raise HTTPException(status_code=503, detail="Service starting up")
    try:
        reply, perfumes = await agent.chat(request.message, request.history)
        for p in perfumes:
            _enrich_result(p)
        return ChatResponse(reply=reply, recommendations=perfumes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/search")
async def search(q: str, top_k: int = 5):
    if rag is None:
        raise HTTPException(status_code=503, detail="Service starting up")
    results = rag.search(q, top_k=top_k)
    return {"results": results, "query": q}


