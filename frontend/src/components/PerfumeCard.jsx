import { useState, useEffect } from 'react'
import axios from 'axios'

const FAMILY_COLORS = {
  'Floral':   'bg-pink-50 text-pink-700',
  'Woody':    'bg-amber-50 text-amber-700',
  'Oriental': 'bg-purple-50 text-purple-700',
  'Fresh':    'bg-teal-50 text-teal-700',
  'Gourmand': 'bg-orange-50 text-orange-700',
  'Citrus':   'bg-yellow-50 text-yellow-700',
  'Aquatic':  'bg-blue-50 text-blue-700',
  'Aromatic': 'bg-emerald-50 text-emerald-700',
  'default':  'bg-stone-100 text-stone-600',
}

const INTENSITY_MAX = { light: 1, moderate: 2, strong: 3, 'very strong': 4 }

function familyColor(family) {
  const key = Object.keys(FAMILY_COLORS).find((k) => family?.includes(k))
  return FAMILY_COLORS[key] || FAMILY_COLORS.default
}

function PriceTag({ price_inr, price_usd, size_ml }) {
  if (!price_inr && !price_usd) return null
  const display = price_inr ? `₹${price_inr.toLocaleString('en-IN')}` : `$${price_usd}`
  return (
    <div className="flex items-baseline gap-1">
      <span className="text-stone-800 font-semibold text-base">{display}</span>
      {size_ml && <span className="text-stone-400 text-xs">/ {size_ml}ml</span>}
    </div>
  )
}

function PerfumeImage({ perfume }) {
  const [imageUrl, setImageUrl] = useState(perfume.image_url || null)
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)

  useEffect(() => {
    if (imageUrl || !perfume.id) return
    axios.get(`/api/perfumes/${perfume.id}/image`)
      .then((res) => { if (res.data.url) setImageUrl(res.data.url) })
      .catch(() => {})
  }, [perfume.id])

  return (
    <div className="relative w-full h-52 overflow-hidden rounded-t-2xl bg-stone-100">
      {imageUrl && !errored && (
        <img
          src={imageUrl}
          alt={`${perfume.name} by ${perfume.brand}`}
          className={`w-full h-full object-contain p-4 transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          loading="lazy"
        />
      )}
      {(!loaded || !imageUrl || errored) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-serif text-stone-300">{perfume.brand?.[0]}</span>
        </div>
      )}
      <div className="absolute top-3 right-3">
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${familyColor(perfume.family)}`}>
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
    <div className="card-hover overflow-hidden animate-slide-up">
      <PerfumeImage perfume={perfume} />

      <div className="p-5">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            {rank && <span className="text-xs font-semibold text-stone-400 uppercase tracking-widest">#{rank} Pick</span>}
            <h3 className="font-serif text-lg text-stone-900 leading-tight mt-0.5 truncate">{perfume.name}</h3>
            <p className="text-stone-500 text-sm">{perfume.brand}</p>
          </div>
          <div className="ml-3 flex-shrink-0 text-right">
            <PriceTag price_inr={perfume.price_inr} price_usd={perfume.price_usd} size_ml={perfume.size_ml} />
            <div className="flex items-center gap-0.5 mt-1.5 justify-end">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full ${i < dots ? 'bg-stone-700' : 'bg-stone-200'}`} />
              ))}
            </div>
          </div>
        </div>

        <p className="text-stone-500 text-sm leading-relaxed mb-4 line-clamp-2">{perfume.description}</p>

        <div className="mb-4">
          <p className="text-xs text-stone-400 uppercase tracking-wider mb-1.5">Notes</p>
          <div className="flex flex-wrap gap-1.5">
            {allNotes.map((note) => <span key={note} className="tag">{note}</span>)}
          </div>
        </div>

        {reason && (
          <div className="border-t border-stone-100 pt-3">
            <p className="text-xs text-stone-500 leading-relaxed">
              <span className="font-semibold text-stone-700">AI Insight: </span>{reason}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-100">
          <div className="flex gap-2 text-xs text-stone-400">
            <span className="capitalize">{perfume.gender}</span>
            <span>·</span>
            <span className="capitalize">{perfume.occasions?.[0]}</span>
          </div>
          <div className="flex gap-2 text-xs text-stone-400">
            <span className="capitalize">{perfume.longevity}</span>
            <span>·</span>
            <span className="capitalize">{perfume.sillage}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
