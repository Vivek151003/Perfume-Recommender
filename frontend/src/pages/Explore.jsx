import { useState, useEffect } from 'react'
import axios from 'axios'
import PerfumeCard from '../components/PerfumeCard'

const FAMILIES = ['All', 'Floral', 'Woody', 'Oriental', 'Fresh', 'Gourmand', 'Citrus', 'Aquatic', 'Aromatic']
const GENDERS = ['All', 'feminine', 'masculine', 'unisex']
const PRICES = ['All', 'affordable', 'mid', 'high', 'luxury', 'ultra-luxury']

export default function Explore() {
  const [perfumes, setPerfumes] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [family, setFamily] = useState('All')
  const [gender, setGender] = useState('All')
  const [price, setPrice] = useState('All')
  const [fxRate, setFxRate] = useState(null)

  useEffect(() => {
    axios.get('/api/perfumes').then((res) => {
      setPerfumes(res.data.perfumes)
      setFiltered(res.data.perfumes)
    }).catch(() => {}).finally(() => setLoading(false))
    axios.get('/api/currency').then((res) => setFxRate(res.data.usd_to_inr)).catch(() => {})
  }, [])

  useEffect(() => {
    let f = perfumes
    if (search) {
      const q = search.toLowerCase()
      f = f.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        [...p.top_notes, ...p.middle_notes, ...p.base_notes].some((n) => n.toLowerCase().includes(q))
      )
    }
    if (family !== 'All') f = f.filter((p) => p.family.includes(family))
    if (gender !== 'All') f = f.filter((p) => p.gender === gender)
    if (price !== 'All') f = f.filter((p) => p.price_range === price)
    setFiltered(f)
  }, [search, family, gender, price, perfumes])

  return (
    <main className="min-h-screen pt-24 pb-16 px-6 bg-stone-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10 flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-serif text-4xl text-stone-900 mb-2">Explore Fragrances</h1>
            <p className="text-stone-500">Browse our curated collection of {perfumes.length} iconic fragrances.</p>
          </div>
          {fxRate && (
            <div className="text-xs px-3 py-1.5 rounded-full bg-white border border-stone-200 text-stone-500">
              Live rate: <span className="text-stone-800 font-semibold">1 USD = ₹{fxRate.toFixed(2)}</span>
            </div>
          )}
        </div>

        <div className="card p-6 mb-8 space-y-4">
          <input className="input-field" placeholder="Search by name, brand, or notes..."
            value={search} onChange={(e) => setSearch(e.target.value)} />

          <div className="flex flex-wrap gap-6">
            {[
              { label: 'Family', opts: FAMILIES, val: family, set: setFamily },
              { label: 'Gender', opts: GENDERS, val: gender, set: setGender },
              { label: 'Price', opts: PRICES, val: price, set: setPrice },
            ].map(({ label, opts, val, set }) => (
              <div key={label}>
                <p className="text-xs text-stone-400 uppercase tracking-wider font-medium mb-2">{label}</p>
                <div className="flex flex-wrap gap-1.5">
                  {opts.map((o) => (
                    <button key={o} onClick={() => set(o)}
                      className={`text-xs px-3 py-1 rounded-full border transition-all capitalize
                        ${val === o ? 'chip-active' : 'chip'}`}>
                      {o}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {filtered.length !== perfumes.length && (
            <p className="text-xs text-stone-400">Showing {filtered.length} of {perfumes.length} perfumes</p>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20 text-stone-400">
            <div className="w-8 h-8 border-2 border-stone-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading perfumes...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-stone-400">No perfumes match your filters.</div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filtered.map((p) => <PerfumeCard key={p.id} perfume={p} />)}
          </div>
        )}
      </div>
    </main>
  )
}
