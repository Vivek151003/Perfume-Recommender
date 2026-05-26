"""Convert fra_cleaned.csv → perfumes.json with derived fields.

Run: python data/build_perfumes.py
"""
import csv
import json
import re
from collections import OrderedDict
from pathlib import Path

HERE         = Path(__file__).parent
CSV_PATH     = HERE / "fra_cleaned.csv"
CURATED_PATH = HERE / "perfumes_curated.json"   # backup of the original hand-tuned 82
OUT_PATH     = HERE / "perfumes.json"

MIN_RATING_COUNT = 1000  # only keep popular enough perfumes (≈ 2500)


# ---------------- brand normalisation ----------------
def titlecase_brand(slug: str) -> str:
    s = slug.replace("-", " ").replace("_", " ").strip()
    fixes = {
        "yves saint laurent": "Yves Saint Laurent",
        "victoria s secret":  "Victoria's Secret",
        "lattafa perfumes":   "Lattafa",
        "al haramain perfumes": "Al Haramain",
        "swiss arabian":      "Swiss Arabian",
        "dolce gabbana":      "Dolce & Gabbana",
        "o boticario":        "O Boticário",
        "l occitane en provence": "L'Occitane en Provence",
        "jo malone london":   "Jo Malone London",
        "maison francis kurkdjian": "Maison Francis Kurkdjian",
        "bath body works":    "Bath & Body Works",
        "carolina herrera":   "Carolina Herrera",
        "jean paul gaultier": "Jean Paul Gaultier",
        "hugo boss":          "Hugo Boss",
        "donna karan":        "Donna Karan",
        "estee lauder":       "Estée Lauder",
        "calvin klein":       "Calvin Klein",
        "paris corner":       "Paris Corner",
        "fragrance world":    "Fragrance World",
        "maison alhambra":    "Maison Alhambra",
        "tom ford":           "Tom Ford",
        "roja dove":          "Roja Parfums",
        "boadicea the victorious": "Boadicea the Victorious",
        "louis vuitton":      "Louis Vuitton",
        "parfums de marly":   "Parfums de Marly",
        "giorgio armani":     "Giorgio Armani",
        "emporio armani":     "Emporio Armani",
        "paco rabanne":       "Paco Rabanne",
        "thierry mugler":     "Mugler",
        "viktor rolf":        "Viktor & Rolf",
        "viktor and rolf":    "Viktor & Rolf",
        "maison margiela":    "Maison Margiela",
        "serge lutens":       "Serge Lutens",
        "escentric molecules":"Escentric Molecules",
        "le labo":            "Le Labo",
        "by kilian":          "Kilian",
    }
    low = s.lower()
    return fixes.get(low, " ".join(w.capitalize() for w in s.split()))


def titlecase_perfume(slug: str) -> str:
    s = re.sub(r"-+", " ", slug).replace("_", " ").strip()
    # Capitalise words but preserve roman numerals etc.
    parts = []
    for w in s.split():
        if w.upper() in ("I","II","III","IV","V","VI","VII","VIII","IX","X","EDP","EDT","EDC"):
            parts.append(w.upper())
        else:
            parts.append(w.capitalize())
    return " ".join(parts)


# ---------------- brand → price tier ----------------
# Approximate INR ranges for 100ml retail in India, then converted to USD.
# Conservative ladder; better to be slightly under than wildly off.
BRAND_PRICE_USD = {
    # Middle-Eastern value (₹1.5k – ₹4k)
    "Lattafa": 32, "Armaf": 32, "Afnan": 35, "Ajmal": 45, "Rasasi": 38,
    "Swiss Arabian": 40, "Al Haramain": 55, "Maison Alhambra": 28,
    "Khadlaj": 24, "Paris Corner": 30, "Fragrance World": 28,
    # Mass-market western (₹2k – ₹5k)
    "Avon": 22, "Oriflame": 24, "Natura": 24, "Zara": 30,
    "O Boticário": 26, "Bath & Body Works": 28, "Victoria's Secret": 35,
    # Designer affordable (₹4k – ₹8k)
    "Hugo Boss": 70, "Versace": 75, "Azzaro": 65, "Calvin Klein": 60,
    "Davidoff": 55, "Lacoste": 60, "Mugler": 90, "Paco Rabanne": 85,
    # Designer mid (₹6k – ₹12k)
    "Dolce & Gabbana": 95, "Carolina Herrera": 95, "Lancôme": 100,
    "Givenchy": 95, "Kenzo": 80, "Burberry": 95, "Jean Paul Gaultier": 90,
    "Donna Karan": 90, "Estée Lauder": 90, "Valentino": 110,
    # Designer high (₹8k – ₹18k)
    "Dior": 130, "Yves Saint Laurent": 130, "Chanel": 150, "Giorgio Armani": 120,
    "Emporio Armani": 95, "Prada": 130, "Hermès": 140, "Gucci": 130,
    "Tom Ford": 180, "Viktor & Rolf": 110, "Bulgari": 110, "Acqua di Parma": 180,
    "Maison Margiela": 150, "Jo Malone London": 150, "Issey Miyake": 95,
    # Niche / luxury (₹15k – ₹40k+)
    "Creed": 350, "Parfums de Marly": 320, "Xerjoff": 380, "Amouage": 380,
    "Roja Parfums": 600, "Boadicea the Victorious": 380, "Mancera": 130,
    "Montale": 130, "Initio": 320, "Maison Francis Kurkdjian": 280,
    "Le Labo": 220, "Kilian": 280, "Serge Lutens": 180, "Escentric Molecules": 160,
    "Louis Vuitton": 320, "Guerlain": 160, "L'Occitane en Provence": 80,
}
DEFAULT_PRICE_USD = 75  # generic designer fallback


# ---------------- Middle Eastern brands ----------------
ME_BRANDS = {
    "Lattafa", "Ajmal", "Rasasi", "Swiss Arabian", "Al Haramain",
    "Armaf", "Afnan", "Maison Alhambra", "Khadlaj", "Paris Corner",
    "Fragrance World",
}


# ---------------- accord → mood/season/occasion ----------------
ACCORD_SEASONS = {
    "citrus":["spring","summer"], "fresh":["spring","summer"], "aquatic":["spring","summer"],
    "marine":["spring","summer"], "green":["spring","summer"], "fruity":["spring","summer"],
    "aromatic":["spring","fall"], "white floral":["spring","summer"], "floral":["spring","summer"],
    "rose":["spring","fall","winter"], "powdery":["fall","winter","spring"],
    "warm spicy":["fall","winter"], "fresh spicy":["fall","spring"], "amber":["fall","winter"],
    "vanilla":["fall","winter"], "sweet":["fall","winter"], "oud":["fall","winter"],
    "leather":["fall","winter"], "tobacco":["fall","winter"], "smoky":["fall","winter"],
    "woody":["fall","winter"], "musky":["fall","winter"], "earthy":["fall","winter"],
    "gourmand":["fall","winter"],
}
ACCORD_MOODS = {
    "citrus":["fresh","energetic"], "fresh":["fresh","energetic"], "aquatic":["fresh","energetic"],
    "marine":["fresh","energetic"], "green":["fresh","elegant"], "fruity":["playful","fresh"],
    "white floral":["romantic","elegant"], "floral":["romantic","elegant"], "rose":["romantic","elegant"],
    "aromatic":["elegant","fresh"], "powdery":["elegant","romantic"],
    "warm spicy":["bold","cozy"], "fresh spicy":["bold","energetic"], "amber":["cozy","mysterious"],
    "vanilla":["cozy","romantic"], "sweet":["cozy","playful"], "oud":["mysterious","bold"],
    "leather":["bold","mysterious"], "tobacco":["bold","cozy"], "smoky":["mysterious","bold"],
    "woody":["elegant","bold"], "musky":["elegant","romantic"], "earthy":["mysterious","elegant"],
    "gourmand":["cozy","playful"],
}
ACCORD_OCCASIONS = {
    "citrus":["casual","office","outdoor"], "fresh":["casual","office","outdoor"],
    "aquatic":["casual","outdoor","office"], "marine":["casual","outdoor"],
    "green":["casual","outdoor"], "fruity":["casual","office"],
    "white floral":["romantic","evening","formal"], "floral":["romantic","casual"],
    "rose":["romantic","evening"], "aromatic":["office","casual"], "powdery":["office","romantic"],
    "warm spicy":["evening","formal"], "fresh spicy":["office","casual"],
    "amber":["evening","formal","romantic"], "vanilla":["romantic","casual"],
    "sweet":["casual","romantic"], "oud":["evening","formal","romantic"],
    "leather":["evening","formal"], "tobacco":["evening","formal"],
    "smoky":["evening","formal"], "woody":["office","evening"],
    "musky":["casual","office"], "earthy":["casual","office"], "gourmand":["casual","romantic"],
}


def derive(accords, table, default):
    out: list[str] = []
    for a in accords:
        for x in table.get(a, []):
            if x not in out:
                out.append(x)
    return out or default


def normalise_gender(g: str) -> str:
    g = (g or "").lower().strip()
    if g in ("women","female","woman"):  return "feminine"
    if g in ("men","male","man"):        return "masculine"
    return "unisex"


def price_range_tier(usd: int) -> str:
    if usd < 50:  return "affordable"
    if usd < 100: return "mid"
    if usd < 200: return "high"
    if usd < 350: return "luxury"
    return "ultra-luxury"


def longevity_from_rating(rating: float) -> tuple[str, str, str]:
    """Without explicit longevity data, fall back to gentle defaults."""
    return ("very good", "moderate", "moderate")  # longevity, sillage, intensity


def split_notes(field: str) -> list[str]:
    if not field: return []
    return [n.strip().title() for n in field.split(",") if n.strip()]


def build_description(name: str, brand: str, accords: list[str], notes_text: str) -> str:
    headline = ", ".join(accords[:3]) if accords else "fragrance"
    if notes_text:
        return f"{name} by {brand} — a {headline} composition featuring {notes_text}."
    return f"{name} by {brand} — a {headline} fragrance."


# ---------------- main ----------------
def main():
    # 1. Load curated 82 (canonical, kept verbatim) if a backup exists,
    #    otherwise from the current perfumes.json.
    src = CURATED_PATH if CURATED_PATH.exists() else OUT_PATH
    curated = json.loads(src.read_text(encoding="utf-8")) if src.exists() else []
    # Key by lowered (name, brand) to detect duplicates.
    curated_keys = {(p["name"].lower(), p["brand"].lower()) for p in curated}
    print(f"Curated entries kept: {len(curated)} (from {src.name})")

    # 2. Walk the CSV.
    kept = []
    skipped_low_rating = 0
    with CSV_PATH.open(encoding="latin-1") as f:
        reader = csv.DictReader(f, delimiter=";")
        for row in reader:
            try:
                rc = int(row.get("Rating Count", "0") or 0)
            except ValueError:
                rc = 0
            if rc < MIN_RATING_COUNT:
                skipped_low_rating += 1
                continue

            name  = titlecase_perfume(row["Perfume"])
            brand = titlecase_brand(row["Brand"])
            if (name.lower(), brand.lower()) in curated_keys:
                continue  # curated entry wins

            accords = [row.get(f"mainaccord{i}", "").strip().lower()
                       for i in range(1, 6)]
            accords = [a for a in accords if a]
            family  = " ".join(a.title() for a in accords[:2]) or "Mixed"

            top    = split_notes(row.get("Top", ""))
            middle = split_notes(row.get("Middle", ""))
            base   = split_notes(row.get("Base", ""))
            notes_text = ", ".join((top + middle + base)[:6])

            longev, sillage, intensity = longevity_from_rating(0)

            price_usd = BRAND_PRICE_USD.get(brand, DEFAULT_PRICE_USD)
            try:
                year = int(row.get("Year", "") or 0) or None
            except ValueError:
                year = None

            kept.append({
                "id":           f"f{len(kept)+1:05d}",
                "name":         name,
                "brand":        brand,
                "family":       family,
                "gender":       normalise_gender(row.get("Gender", "")),
                "top_notes":    top,
                "middle_notes": middle,
                "base_notes":   base,
                "occasions":    derive(accords, ACCORD_OCCASIONS, ["casual"]),
                "seasons":      derive(accords, ACCORD_SEASONS, ["spring","summer","fall","winter"]),
                "price_range":  price_range_tier(price_usd),
                "longevity":    longev,
                "sillage":      sillage,
                "description":  build_description(name, brand, accords, notes_text),
                "mood":         derive(accords, ACCORD_MOODS, ["elegant"]),
                "intensity":    intensity,
                "year":         year,
                "price_usd":    price_usd,
                "size_ml":      100,
                "origin":       "middle_eastern" if brand in ME_BRANDS else "designer",
                "main_accords": accords,
                "rating_count": rc,
            })

    print(f"CSV entries kept (rating ≥ {MIN_RATING_COUNT}): {len(kept)}")
    print(f"  skipped for low rating: {skipped_low_rating}")

    # 3. Merge — curated entries first (priority for budget filter, sidebar).
    merged = list(curated) + kept
    OUT_PATH.write_text(json.dumps(merged, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {len(merged)} perfumes → {OUT_PATH.name}")

    # 4. Distribution sanity.
    me_total   = sum(1 for p in merged if p.get("origin") == "middle_eastern")
    under_5k   = sum(1 for p in merged if (p.get("price_usd") or 999) <= 58)
    print(f"  Middle Eastern total: {me_total}")
    print(f"  Under ~₹5K (USD ≤ 58): {under_5k}")


if __name__ == "__main__":
    main()
