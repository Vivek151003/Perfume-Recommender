import { useState, useEffect } from 'react'
import axios from 'axios'

const FAMILY_BG = {
  'Floral':    'from-pink-950/60 to-rose-950/30',
  'Woody':     'from-amber-950/60 to-stone-950/30',
  'Oriental':  'from-purple-950/60 to-amber-950/30',
  'Fresh':     'from-cyan-950/60 to-teal-950/30',
  'Gourmand':  'from-orange-950/60 to-amber-950/30',
  'Citrus':    'from-yellow-950/60 to-lime-950/30',
  'Aquatic':   'from-blue-950/60 to-cyan-950/30',
  'Aromatic':  'from-emerald-950/60 to-teal-950/30',
  'default':   'from-stone-900/60 to-stone-800/30',
}

const INTENSITY_MAX = { light: 1, moderate: 2, strong: 3, 'very strong': 4 }

function familyBg(family) {
  const key = Object.keys(FAMILY_BG).find((k) => family?.includes(k))
  return FAMILY_BG[key] || FAMILY_BG.default
}

function PriceTag({ price_inr, price_usd, size_ml }) {
  if (!price_inr && !price_usd) return null
  const display = price_inr
    ? `₹${price_inr.toLocaleString('en-IN')}`
    : `$${price_usd}`
  return (
    <div className="flex items-baseline gap-1">
      <span className="text-gold-400 font-semibold text-base">{display}</span>
      {size_ml && <span className="text-stone-500 text-xs">/ {size_ml}ml</span>}
    </div>
  )
}

function PerfumeImage({ perfume }) {
  const [imageUrl, setImageUrl] = useState(perfume.image_url || null)
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)

  useEffect(() => {
    if (imageUrl || !perfume.id) return
    // Fetch lazily from backend image endpoint
    axios.get(`/api/perfumes/${perfume.id}/image`)
      .then((res) => { if (res.data.url) setImageUrl(res.data.url) })
      .catch(() => {})
  }, [perfume.id])

  const showGradient = !imageUrl || errored

  return (
    <div className={`relative w-full h-52 overflow-hidden rounded-t-2xl bg-gradient-to-br ${familyBg(perfume.family)}`}>
      {imageUrl && !errored && (
        <img
          src={imageUrl}
          alt={`${perfume.name} by ${perfume.brand}`}
          className={`w-full h-full object-contain p-3 transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          loading="lazy"
        />
      )}
      {(!loaded || showGradient) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl opacity-20 font-serif">{perfume.brand?.[0]}</span>
        </div>
      )}
      {/* Family badge */}
      <div className="absolute top-3 right-3">
        <span className="text-xs px-2 py-1 rounded-full bg-stone-950/70 backdrop-blur-sm text-stone-300 border border-stone-700/40">
          {perfume.family}
        </span>
      </div>
    </div>
  )
}

export default function PerfumeCard({ perfume, reason, rank }) {
  const allNotes = [
    ...perfume.top_notes.slice(0, 2),
    ...perfume.middle_notes.slice(0, 2),
    ...perfume.base_notes.slice(0, 1),
  ]
  const dots = INTENSITY_MAX[perfume.intensity] || 2

  return (
    <div className="card-glass overflow-hidden animate-slide-up hover:border-stone-700/80 transition-colors">
      <PerfumeImage perfume={perfume} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            {rank && (
              <span className="text-xs font-semibold text-gold-500/70 uppercase tracking-widest">
                #{rank} Pick
              </span>
            )}
            <h3 className="font-serif text-lg text-stone-100 leading-tight mt-0.5 truncate">
              {perfume.name}
            </h3>
            <p className="text-stone-400 text-sm">{perfume.brand}</p>
          </div>
          <div className="ml-3 flex-shrink-0 text-right">
            <PriceTag price_inr={perfume.price_inr} price_usd={perfume.price_usd} size_ml={perfume.size_ml} />
            <div className="flex items-center gap-0.5 mt-1.5 justify-end">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full ${i < dots ? 'bg-gold-400' : 'bg-stone-700'}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-stone-400 text-sm leading-relaxed mb-4 line-clamp-2">
          {perfume.description}
        </p>

        {/* Notes */}
        <div className="mb-4">
          <p className="text-xs text-stone-600 uppercase tracking-wider mb-1.5">Notes</p>
          <div className="flex flex-wrap gap-1.5">
            {allNotes.map((note) => (
              <span key={note} className="note-tag">{note}</span>
            ))}
          </div>
        </div>

        {/* AI Reason */}
        {reason && (
          <div className="border-t border-stone-700/40 pt-3">
            <p className="text-xs text-gold-400/80 leading-relaxed">
              <span className="font-semibold text-gold-400">AI Insight: </span>
              {reason}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-700/30">
          <div className="flex gap-2 text-xs text-stone-500">
            <span className="capitalize">{perfume.gender}</span>
            <span className="text-stone-700">·</span>
            <span className="capitalize">{perfume.occasions?.[0]}</span>
          </div>
          <div className="flex gap-2 text-xs text-stone-500">
            <span className="capitalize">{perfume.longevity}</span>
            <span className="text-stone-700">·</span>
            <span className="capitalize">{perfume.sillage}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
