"""RAG pipeline: ChromaDB vector store + sentence-transformers for semantic perfume search."""
import hashlib
import json
from pathlib import Path

import chromadb
from chromadb.utils import embedding_functions

from models import UserPreferences


class PerfumeRAG:
    COLLECTION = "perfumes"
    DATA_PATH  = Path(__file__).parent / "data" / "perfumes.json"
    CHROMA_DIR = Path(__file__).parent / ".chroma"
    FP_PATH    = CHROMA_DIR / "fingerprint.txt"

    def __init__(self):
        self.CHROMA_DIR.mkdir(exist_ok=True)
        self._client = chromadb.PersistentClient(path=str(self.CHROMA_DIR))
        self._ef = embedding_functions.SentenceTransformerEmbeddingFunction(
            model_name="all-MiniLM-L6-v2"
        )
        self._collection = self._client.get_or_create_collection(
            name=self.COLLECTION,
            embedding_function=self._ef,
            metadata={"hnsw:space": "cosine"},
        )
        self._perfumes: dict[str, dict] = {}
        self._index()

    def _data_fingerprint(self, raw: bytes) -> str:
        return hashlib.sha256(raw).hexdigest()

    def _build_document(self, perfume: dict) -> str:
        notes = (
            perfume["top_notes"] + perfume["middle_notes"] + perfume["base_notes"]
        )
        return (
            f"{perfume['name']} by {perfume['brand']}. "
            f"A {perfume['family']} fragrance for {perfume['gender']}. "
            f"Notes: {', '.join(notes)}. "
            f"Best for {', '.join(perfume['occasions'])} occasions "
            f"during {', '.join(perfume['seasons'])}. "
            f"Mood: {', '.join(perfume['mood'])}. "
            f"Intensity: {perfume['intensity']}. "
            f"Price: {perfume['price_range']}. "
            f"{perfume['description']}"
        )

    def _index(self):
        raw = self.DATA_PATH.read_bytes()
        perfumes = json.loads(raw)
        # Always keep the in-memory map regardless of whether we re-embed.
        for p in perfumes:
            self._perfumes[p["id"]] = p

        fp_now  = self._data_fingerprint(raw)
        fp_old  = self.FP_PATH.read_text().strip() if self.FP_PATH.exists() else ""
        count   = self._collection.count()

        if count == len(perfumes) and fp_now == fp_old:
            print(f"[rag] Reusing cached embeddings for {count} perfumes.")
            return

        # Data changed (or first run) — rebuild the collection.
        if count > 0:
            print(f"[rag] Data changed (was {count}, now {len(perfumes)}); rebuilding collection.")
            self._client.delete_collection(self.COLLECTION)
            self._collection = self._client.get_or_create_collection(
                name=self.COLLECTION,
                embedding_function=self._ef,
                metadata={"hnsw:space": "cosine"},
            )

        print(f"[rag] Embedding {len(perfumes)} perfumes (one-time cost)…")
        docs, ids, metas = [], [], []
        for p in perfumes:
            docs.append(self._build_document(p))
            ids.append(p["id"])
            metas.append({
                "name": p["name"],
                "brand": p["brand"],
                "family": p["family"],
                "gender": p["gender"],
                "price_range": p["price_range"],
                "intensity": p["intensity"],
            })

        # Add in batches — ChromaDB has per-call size limits and batching gives progress visibility.
        BATCH = 500
        for i in range(0, len(ids), BATCH):
            self._collection.add(
                documents=docs[i:i+BATCH],
                ids=ids[i:i+BATCH],
                metadatas=metas[i:i+BATCH],
            )
            print(f"[rag]   embedded {min(i+BATCH, len(ids))}/{len(ids)}")

        self.FP_PATH.write_text(fp_now)
        print(f"[rag] Done. Cached at {self.CHROMA_DIR}")

    def search(self, query: str, top_k: int = 10) -> list[dict]:
        results = self._collection.query(
            query_texts=[query],
            n_results=min(top_k, self._collection.count()),
        )

        ids = results["ids"][0]
        distances = results["distances"][0]
        hits = []
        for pid, dist in zip(ids, distances):
            p = dict(self._perfumes[pid])
            p["score"] = float(1 - dist)   # cosine similarity
            hits.append(p)
        return hits

    def preferences_to_query(self, prefs: UserPreferences) -> str:
        parts = []
        if prefs.free_text:
            parts.append(prefs.free_text)
        if prefs.families:
            parts.append(f"{' and '.join(prefs.families)} fragrance")
        if prefs.notes_liked:
            parts.append(f"with notes of {', '.join(prefs.notes_liked)}")
        if prefs.occasions:
            parts.append(f"for {', '.join(prefs.occasions)} occasions")
        if prefs.seasons:
            parts.append(f"during {', '.join(prefs.seasons)}")
        if prefs.mood:
            parts.append(f"mood: {', '.join(prefs.mood)}")
        if prefs.gender:
            parts.append(f"for {prefs.gender}")
        if prefs.intensity:
            parts.append(f"{prefs.intensity} intensity")

        return " ".join(parts) if parts else "fresh and elegant fragrance"

    def get_all(self) -> list[dict]:
        return list(self._perfumes.values())

    def get_by_id(self, pid: str) -> dict | None:
        return self._perfumes.get(pid)
