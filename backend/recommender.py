"""Content-based filtering using TF-IDF and cosine similarity on perfume features."""
import json
import numpy as np
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import MultiLabelBinarizer
from sklearn.metrics.pairwise import cosine_similarity

from models import UserPreferences


class ContentBasedRecommender:
    def __init__(self):
        self.perfumes = []
        self.tfidf = TfidfVectorizer(ngram_range=(1, 2), max_features=500)
        self.mlb_occasions = MultiLabelBinarizer()
        self.mlb_seasons = MultiLabelBinarizer()
        self.mlb_mood = MultiLabelBinarizer()
        self.mlb_notes = MultiLabelBinarizer()
        self._feature_matrix = None
        self._load_and_fit()

    def _load_and_fit(self):
        data_path = Path(__file__).parent / "data" / "perfumes.json"
        with open(data_path) as f:
            self.perfumes = json.load(f)

        descriptions = [self._build_text(p) for p in self.perfumes]
        tfidf_features = self.tfidf.fit_transform(descriptions).toarray()

        occasions_mat = self.mlb_occasions.fit_transform([p["occasions"] for p in self.perfumes])
        seasons_mat = self.mlb_seasons.fit_transform([p["seasons"] for p in self.perfumes])
        mood_mat = self.mlb_mood.fit_transform([p["mood"] for p in self.perfumes])

        all_notes = [p["top_notes"] + p["middle_notes"] + p["base_notes"] for p in self.perfumes]
        notes_mat = self.mlb_notes.fit_transform(all_notes)

        self._feature_matrix = np.hstack([
            tfidf_features * 2.0,
            occasions_mat * 3.0,
            seasons_mat * 2.0,
            mood_mat * 2.5,
            notes_mat * 1.5,
        ])

    def _build_text(self, perfume: dict) -> str:
        parts = [
            perfume["name"],
            perfume["brand"],
            perfume["family"],
            perfume["gender"],
            perfume["intensity"],
            perfume["price_range"],
            perfume["description"],
            " ".join(perfume["top_notes"]),
            " ".join(perfume["middle_notes"]),
            " ".join(perfume["base_notes"]),
            " ".join(perfume["mood"]),
        ]
        return " ".join(parts).lower()

    def _preferences_to_vector(self, prefs: UserPreferences) -> np.ndarray:
        text_parts = []
        if prefs.gender:
            text_parts.append(prefs.gender)
        if prefs.intensity:
            text_parts.append(prefs.intensity)
        if prefs.price_range:
            text_parts.append(prefs.price_range)
        if prefs.families:
            text_parts.extend(prefs.families)
        if prefs.notes_liked:
            text_parts.extend(prefs.notes_liked)
        if prefs.free_text:
            text_parts.append(prefs.free_text)
        if prefs.mood:
            text_parts.extend(prefs.mood)

        text = " ".join(text_parts).lower() if text_parts else "fresh floral woody"
        tfidf_vec = self.tfidf.transform([text]).toarray()

        occasions = prefs.occasions if prefs.occasions else []
        seasons = prefs.seasons if prefs.seasons else []
        mood = prefs.mood if prefs.mood else []
        notes = prefs.notes_liked if prefs.notes_liked else []

        occ_vec = self.mlb_occasions.transform([occasions])
        sea_vec = self.mlb_seasons.transform([seasons])
        mood_vec = self.mlb_mood.transform([mood])
        notes_vec = self.mlb_notes.transform([notes])

        return np.hstack([
            tfidf_vec * 2.0,
            occ_vec * 3.0,
            sea_vec * 2.0,
            mood_vec * 2.5,
            notes_vec * 1.5,
        ])

    def recommend(self, prefs: UserPreferences, top_k: int = 10) -> list[dict]:
        pref_vec = self._preferences_to_vector(prefs)
        similarities = cosine_similarity(pref_vec, self._feature_matrix)[0]

        # Penalise disliked notes
        if prefs.notes_disliked:
            disliked_lower = [n.lower() for n in prefs.notes_disliked]
            for i, perfume in enumerate(self.perfumes):
                all_notes = [n.lower() for n in
                             perfume["top_notes"] + perfume["middle_notes"] + perfume["base_notes"]]
                if any(d in all_notes for d in disliked_lower):
                    similarities[i] *= 0.4

        # Filter by gender
        if prefs.gender and prefs.gender != "any":
            for i, perfume in enumerate(self.perfumes):
                if perfume["gender"] not in (prefs.gender, "unisex"):
                    similarities[i] *= 0.3

        top_indices = np.argsort(similarities)[::-1][:top_k]
        results = []
        for idx in top_indices:
            p = dict(self.perfumes[idx])
            p["score"] = float(similarities[idx])
            results.append(p)
        return results
