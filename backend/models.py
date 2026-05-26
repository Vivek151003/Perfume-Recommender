from pydantic import BaseModel
from typing import Optional


class UserPreferences(BaseModel):
    gender: Optional[str] = None          # masculine, feminine, unisex
    occasions: list[str] = []             # casual, office, evening, formal, romantic, outdoor
    seasons: list[str] = []               # spring, summer, fall, winter
    families: list[str] = []              # floral, woody, oriental, fresh, gourmand, citrus
    notes_liked: list[str] = []           # rose, vanilla, oud, citrus, etc.
    notes_disliked: list[str] = []
    intensity: Optional[str] = None       # light, moderate, strong
    mood: list[str] = []                  # fresh, romantic, bold, cozy, etc.
    price_range: Optional[str] = None     # affordable, mid, high, luxury, ultra-luxury (legacy)
    budget_inr: Optional[int] = None      # explicit max budget in INR (e.g. 10000)
    free_text: Optional[str] = None       # any free-form preference description


class ChatMessage(BaseModel):
    role: str   # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    history: list[ChatMessage] = []


class RecommendRequest(BaseModel):
    preferences: UserPreferences
    top_k: int = 5


class PerfumeResult(BaseModel):
    id: str
    name: str
    brand: str
    family: str
    gender: str
    top_notes: list[str]
    middle_notes: list[str]
    base_notes: list[str]
    occasions: list[str]
    seasons: list[str]
    price_range: str
    longevity: str
    sillage: str
    description: str
    mood: list[str]
    intensity: str
    score: float
    reason: str
    price_usd: Optional[int] = None
    price_inr: Optional[int] = None
    size_ml: Optional[int] = None
    image_url: Optional[str] = None
    origin: Optional[str] = None          # "designer" or "middle_eastern"


class RecommendResponse(BaseModel):
    recommendations: list[PerfumeResult]
    designer: list[PerfumeResult] = []
    middle_eastern: list[PerfumeResult] = []
    summary: str
    budget_inr: Optional[int] = None


class ChatResponse(BaseModel):
    reply: str
    recommendations: list[PerfumeResult] = []
