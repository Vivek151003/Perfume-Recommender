"""Groq-powered agentic reasoning layer — perfume search and web discovery."""
import json
import os
import re

from groq import Groq

import websearch
import currency
from models import ChatMessage, PerfumeResult, UserPreferences

MODEL = "llama-3.3-70b-versatile"

SYSTEM_PROMPT = """You are Scentique, an expert AI perfume consultant. You help users find their perfect fragrance.

You have these tools available:
1. search_perfumes       — semantic search in our curated local perfume database
2. filter_perfumes       — filter by gender, occasion, season, price, intensity, family
3. search_web_perfumes   — search the web for perfumes not in the local database

RULES YOU MUST FOLLOW:
- Always call search_perfumes or filter_perfumes before giving recommendations
- When you recommend a perfume, ALWAYS use the EXACT name and brand from the database result
- List each recommendation clearly like: "**Name** by Brand — reason why it fits"
- Explain: scent profile (top/heart/base notes), why it matches the user's preferences, best occasion/season, price in ₹INR

Keep responses warm, expert, and conversational."""


TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_perfumes",
            "description": "Semantically search the local perfume database.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Natural language search query"},
                    "top_k": {"type": "integer", "description": "Results to return (default 6)"},
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "filter_perfumes",
            "description": "Filter local perfumes by structured attributes.",
            "parameters": {
                "type": "object",
                "properties": {
                    "gender":      {"type": "string", "enum": ["masculine", "feminine", "unisex"]},
                    "occasion":    {"type": "string"},
                    "season":      {"type": "string"},
                    "price_range": {"type": "string"},
                    "intensity":   {"type": "string"},
                    "family":      {"type": "string"},
                },
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "search_web_perfumes",
            "description": "Search the web for perfume info not in the local database.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string"},
                },
                "required": ["query"],
            },
        },
    },
]


def _to_perfume_result(p: dict, reason: str = "") -> PerfumeResult:
    return PerfumeResult(
        id=p.get("id", ""),
        name=p.get("name", ""),
        brand=p.get("brand", ""),
        family=p.get("family", ""),
        gender=p.get("gender", ""),
        top_notes=p.get("top_notes", []),
        middle_notes=p.get("middle_notes", []),
        base_notes=p.get("base_notes", []),
        occasions=p.get("occasions", []),
        seasons=p.get("seasons", []),
        price_range=p.get("price_range", ""),
        longevity=p.get("longevity", ""),
        sillage=p.get("sillage", ""),
        description=p.get("description", ""),
        mood=p.get("mood", []),
        intensity=p.get("intensity", ""),
        score=p.get("score", 0.0),
        reason=reason,
        price_usd=p.get("price_usd"),
        size_ml=p.get("size_ml"),
        origin=p.get("origin"),
    )


class PerfumeAgent:
    def __init__(self, rag, recommender):
        self._client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        self._rag = rag
        self._recommender = recommender

    # ------------------------------------------------------------------ #
    # Tool execution
    # ------------------------------------------------------------------ #
    def _run_tool(self, name: str, args: dict) -> tuple[str, list[dict]]:
        if name == "search_perfumes":
            results = self._rag.search(args.get("query", ""), top_k=args.get("top_k", 6))
            clean = [{k: v for k, v in r.items() if k != "score"} for r in results]
            return json.dumps(clean), results

        if name == "filter_perfumes":
            filtered = []
            for p in self._rag.get_all():
                g = args.get("gender")
                if g and p["gender"] not in (g, "unisex"):
                    continue
                if args.get("occasion") and args["occasion"] not in p["occasions"]:
                    continue
                if args.get("season") and args["season"] not in p["seasons"]:
                    continue
                if args.get("price_range") and p["price_range"] != args["price_range"]:
                    continue
                if args.get("intensity") and p["intensity"] != args["intensity"]:
                    continue
                fam = args.get("family", "").lower()
                if fam and fam not in p["family"].lower():
                    continue
                filtered.append(p)
            for p in filtered:
                p["score"] = 1.0
            return json.dumps(filtered[:6]), filtered[:6]

        if name == "search_web_perfumes":
            results = websearch.search_web(args.get("query", "") + " perfume notes review", max_results=5)
            text = "\n\n".join(
                f"**{r.get('title','')}**\n{r.get('body','')[:400]}" for r in results if r.get("title")
            )
            return text or "No results.", []

        return json.dumps({"error": "unknown tool"}), []

    # ------------------------------------------------------------------ #
    # Extract perfumes mentioned by name in the reply text
    # ------------------------------------------------------------------ #
    def _perfumes_from_reply(self, reply_text: str, score_lookup: dict[str, float] | None = None) -> list[dict]:
        text_lower = reply_text.lower()
        score_lookup = score_lookup or {}
        hits: list[tuple[int, dict]] = []
        seen: set[str] = set()

        for p in self._rag.get_all():
            name = p["name"].lower()
            if len(name) < 3:
                continue
            m = re.search(rf"\b{re.escape(name)}\b", text_lower)
            if m and p["id"] not in seen:
                seen.add(p["id"])
                perfume = dict(p)
                perfume["score"] = score_lookup.get(p["id"], 1.0)
                hits.append((m.start(), perfume))

        hits.sort(key=lambda x: x[0])
        return [h[1] for h in hits]

    # ------------------------------------------------------------------ #
    # Candidate selection — RRF fusion + dislike/price filtering
    # ------------------------------------------------------------------ #
    @staticmethod
    def _reciprocal_rank_fusion(rankings: list[list[dict]], k: int = 60) -> list[dict]:
        fused: dict[str, dict] = {}
        rrf_scores: dict[str, float] = {}
        for ranking in rankings:
            for rank, item in enumerate(ranking):
                pid = item["id"]
                rrf_scores[pid] = rrf_scores.get(pid, 0.0) + 1.0 / (k + rank + 1)
                if pid not in fused:
                    fused[pid] = dict(item)
        return sorted(fused.values(), key=lambda p: rrf_scores[p["id"]], reverse=True)

    @staticmethod
    def _filter_candidates(candidates: list[dict], prefs: UserPreferences) -> list[dict]:
        """Drop candidates with disliked notes; enforce INR budget; soft-filter on price tier."""
        disliked = {n.lower() for n in (prefs.notes_disliked or [])}
        kept: list[dict] = []
        for p in candidates:
            all_notes = {n.lower() for n in p["top_notes"] + p["middle_notes"] + p["base_notes"]}
            if disliked & all_notes:
                continue
            kept.append(p)

        if prefs.budget_inr:
            rate = currency.get_usd_to_inr()
            budget_usd = (prefs.budget_inr / rate) if rate else None
            if budget_usd:
                kept = [
                    p for p in kept
                    if p.get("price_usd") is not None and p["price_usd"] <= budget_usd * 1.05
                ]
            return kept

        if prefs.price_range:
            matched = [p for p in kept if p.get("price_range") == prefs.price_range]
            if len(matched) >= 3:
                kept = matched

        return kept or candidates

    # ------------------------------------------------------------------ #
    # Chat (agentic loop)
    # ------------------------------------------------------------------ #
    def chat(self, user_message: str, history: list[ChatMessage]) -> tuple[str, list[PerfumeResult]]:
        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        for h in history:
            messages.append({"role": h.role, "content": h.content})
        messages.append({"role": "user", "content": user_message})

        collected_perfumes: list[dict] = []

        for _ in range(8):
            response = self._client.chat.completions.create(
                model=MODEL,
                messages=messages,
                tools=TOOLS,
                tool_choice="auto",
                max_tokens=1500,
            )
            msg    = response.choices[0].message
            finish = response.choices[0].finish_reason

            if finish == "tool_calls" and msg.tool_calls:
                messages.append({
                    "role": "assistant",
                    "content": msg.content or "",
                    "tool_calls": [
                        {"id": tc.id, "type": "function",
                         "function": {"name": tc.function.name, "arguments": tc.function.arguments}}
                        for tc in msg.tool_calls
                    ],
                })
                for tc in msg.tool_calls:
                    try:
                        args = json.loads(tc.function.arguments)
                    except json.JSONDecodeError:
                        args = {}
                    tool_output, raw = self._run_tool(tc.function.name, args)
                    collected_perfumes.extend(raw)
                    messages.append({"role": "tool", "tool_call_id": tc.id, "content": tool_output})
            else:
                reply = msg.content or ""

                score_lookup = {p["id"]: p.get("score", 1.0) for p in collected_perfumes}
                mentioned = self._perfumes_from_reply(reply, score_lookup)

                seen = {p["id"] for p in mentioned}
                for p in collected_perfumes:
                    if p["id"] not in seen:
                        seen.add(p["id"])
                        mentioned.append(p)
                    if len(mentioned) >= 5:
                        break

                return reply, [_to_perfume_result(p) for p in mentioned[:5]]

        return "Here are my recommendations!", [_to_perfume_result(p) for p in collected_perfumes[:5]]

    # ------------------------------------------------------------------ #
    # Structured recommendation (quiz mode)
    # ------------------------------------------------------------------ #
    def get_recommendations(
        self, prefs: UserPreferences, top_k: int = 5
    ) -> tuple[str, list[PerfumeResult], list[PerfumeResult]]:
        """Return (summary, designer_picks, middle_eastern_picks)."""
        query       = self._rag.preferences_to_query(prefs)
        rag_results = self._rag.search(query, top_k=top_k * 6)
        cb_results  = self._recommender.recommend(prefs, top_k=top_k * 6)

        fused    = self._reciprocal_rank_fusion([rag_results, cb_results])
        filtered = self._filter_candidates(fused, prefs)

        designer_pool       = [p for p in filtered if p.get("origin") != "middle_eastern"]
        middle_eastern_pool = [p for p in filtered if p.get("origin") == "middle_eastern"]
        candidates          = designer_pool[: top_k * 2] + middle_eastern_pool[: top_k * 2]

        budget_str = f"₹{prefs.budget_inr:,} max" if prefs.budget_inr else (prefs.price_range or 'any')
        pref_desc = f"""User preferences:
- Gender: {prefs.gender or 'any'} | Occasions: {', '.join(prefs.occasions) or 'any'}
- Seasons: {', '.join(prefs.seasons) or 'any'} | Families: {', '.join(prefs.families) or 'any'}
- Liked notes: {', '.join(prefs.notes_liked) or 'none'} | Disliked: {', '.join(prefs.notes_disliked) or 'none'}
- Intensity: {prefs.intensity or 'any'} | Mood: {', '.join(prefs.mood) or 'any'}
- Budget: {budget_str} | Extra: {prefs.free_text or 'none'}

CRITICAL RULES:
1. Every perfume you recommend MUST fit within the user's budget. The candidates below have already been filtered — pick ONLY from them.
2. Split your recommendations into TWO sections with these exact headings:
     ## Designer Picks
     ## Middle Eastern Picks
3. Use the EXACT names from the candidate list and bold them like **Name**.
4. Mention the ₹INR price for every pick. If a section has no candidates, write "No matches in this category within your budget." under its heading."""

        def candidate_json(pool):
            return json.dumps([
                {**{k: v for k, v in c.items() if k != 'score'},
                 'price_inr': currency.usd_to_inr(c.get('price_usd'))}
                for c in pool
            ], indent=2)

        prompt = f"""{pref_desc}

Designer candidates (prices in ₹INR):
{candidate_json(designer_pool[: top_k * 2])}

Middle Eastern candidates (prices in ₹INR):
{candidate_json(middle_eastern_pool[: top_k * 2])}

Pick the top picks in each section (aim for {top_k} across both). For each write 2-3 sentences referencing the user's preferences. Start with a 1-paragraph intro before the first section heading."""

        def fallback_summary() -> str:
            def section(title, pool):
                if not pool:
                    return f"## {title}\nNo matches in this category within your budget.\n"
                bullets = "\n".join(
                    f"- **{p['name']}** by {p['brand']} (₹{currency.usd_to_inr(p.get('price_usd')) or '?':,}) — {p['description'][:120]}"
                    for p in pool[:top_k]
                )
                return f"## {title}\n{bullets}\n"
            return (
                "Here are the closest matches within your budget (AI summary temporarily unavailable):\n\n"
                + section("Designer Picks", designer_pool)
                + "\n"
                + section("Middle Eastern Picks", middle_eastern_pool)
            )

        if not candidates:
            empty_msg = (
                f"We couldn't find any perfumes within your ₹{prefs.budget_inr:,} budget"
                if prefs.budget_inr else
                "No matching perfumes found for these preferences"
            ) + ". Try raising your budget or relaxing a filter."
            return empty_msg, [], []

        try:
            response = self._client.chat.completions.create(
                model=MODEL,
                messages=[
                    {"role": "system", "content": "You are Scentique, an expert AI perfume consultant."},
                    {"role": "user", "content": prompt},
                ],
                max_tokens=1800,
            )
            summary = response.choices[0].message.content or ""
        except Exception as e:
            print(f"[agent] Groq call failed, falling back: {e}")
            return (
                fallback_summary(),
                [_to_perfume_result(p) for p in designer_pool[:top_k]],
                [_to_perfume_result(p) for p in middle_eastern_pool[:top_k]],
            )

        candidate_ids = {p["id"] for p in candidates}
        score_lookup  = {p["id"]: p.get("score", 1.0) for p in candidates}
        mentioned     = [
            p for p in self._perfumes_from_reply(summary, score_lookup)
            if p["id"] in candidate_ids
        ]

        def pick(pool: list[dict], origin: str) -> list[dict]:
            chosen, seen = [], set()
            for p in mentioned:
                if p.get("origin", "designer") == origin or (origin == "designer" and p.get("origin") != "middle_eastern"):
                    if p["id"] in {x["id"] for x in pool} and p["id"] not in seen:
                        seen.add(p["id"])
                        chosen.append(p)
            for p in pool:
                if len(chosen) >= top_k:
                    break
                if p["id"] not in seen:
                    seen.add(p["id"])
                    chosen.append(p)
            return chosen

        designer_picks = pick(designer_pool, "designer")
        me_picks       = pick(middle_eastern_pool, "middle_eastern")

        return (
            summary,
            [_to_perfume_result(p) for p in designer_picks],
            [_to_perfume_result(p) for p in me_picks],
        )
