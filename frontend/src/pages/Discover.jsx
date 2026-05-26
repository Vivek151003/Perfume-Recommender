import { useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import PerfumeCard from '../components/PerfumeCard'

const FAMILIES = ['Floral', 'Woody', 'Oriental', 'Fresh', 'Gourmand', 'Citrus', 'Aquatic', 'Chypre', 'Fougère']
const OCCASIONS = ['casual', 'office', 'evening', 'formal', 'romantic', 'outdoor']
const SEASONS = ['spring', 'summer', 'fall', 'winter']
const MOODS = ['fresh', 'romantic', 'bold', 'cozy', 'mysterious', 'energetic', 'elegant', 'playful']
const GENDERS = [
  { value: 'any', label: 'Any' },
  { value: 'feminine', label: 'Feminine' },
  { value: 'masculine', label: 'Masculine' },
  { value: 'unisex', label: 'Unisex' },
]
const INTENSITIES = ['light', 'moderate', 'strong', 'very strong']
const BUDGET_PRESETS = [
  { value: 5000,  label: 'Under ₹5,000' },
  { value: 10000, label: 'Under ₹10,000' },
  { value: 20000, label: 'Under ₹20,000' },
  { value: 35000, label: 'Under ₹35,000' },
  { value: null,  label: 'No limit' },
]

function MultiSelect({ label, options, selected, onChange }) {
  const toggle = (v) =>
    onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v])

  return (
    <div>
      <p className="text-sm text-stone-400 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => toggle(opt)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-all capitalize
              ${selected.includes(opt)
                ? 'bg-gold-500/20 border-gold-500/50 text-gold-300'
                : 'border-stone-700/50 text-stone-400 hover:border-stone-600 hover:text-stone-200'
              }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

function SingleSelect({ label, options, selected, onChange }) {
  return (
    <div>
      <p className="text-sm text-stone-400 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const value = typeof opt === 'object' ? opt.value : opt
          const display = typeof opt === 'object' ? opt.label : opt
          return (
            <button
              key={value}
              onClick={() => onChange(selected === value ? null : value)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-all capitalize
                ${selected === value
                  ? 'bg-gold-500/20 border-gold-500/50 text-gold-300'
                  : 'border-stone-700/50 text-stone-400 hover:border-stone-600 hover:text-stone-200'
                }`}
            >
              {display}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function Discover() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [designerResults, setDesignerResults] = useState([])
  const [middleEasternResults, setMiddleEasternResults] = useState([])
  const [summary, setSummary] = useState('')
  const [usedBudget, setUsedBudget] = useState(null)

  const [prefs, setPrefs] = useState({
    gender: null,
    occasions: [],
    seasons: [],
    families: [],
    notes_liked: '',
    notes_disliked: '',
    intensity: null,
    mood: [],
    budget_inr: null,
    free_text: '',
  })
  const [customBudget, setCustomBudget] = useState('')

  const update = (key) => (val) => setPrefs((p) => ({ ...p, [key]: val }))

  const submit = async () => {
    setLoading(true)
    try {
      const customAsNum = customBudget ? parseInt(customBudget, 10) : null
      const effectiveBudget = customAsNum && customAsNum > 0 ? customAsNum : prefs.budget_inr
      const payload = {
        preferences: {
          ...prefs,
          budget_inr: effectiveBudget,
          notes_liked: prefs.notes_liked
            ? prefs.notes_liked.split(',').map((n) => n.trim()).filter(Boolean)
            : [],
          notes_disliked: prefs.notes_disliked
            ? prefs.notes_disliked.split(',').map((n) => n.trim()).filter(Boolean)
            : [],
        },
        top_k: 5,
      }
      const res = await axios.post('/api/recommend', payload)
      setDesignerResults(res.data.designer || [])
      setMiddleEasternResults(res.data.middle_eastern || [])
      setSummary(res.data.summary)
      setUsedBudget(res.data.budget_inr ?? effectiveBudget ?? null)
      setStep(3)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Something went wrong. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="font-serif text-4xl text-stone-100 mb-3">Discover Your Scent</h1>
          <p className="text-stone-400">
            Answer a few questions and our AI will find your perfect fragrance match.
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3 mb-10 justify-center">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all
                  ${step >= s ? 'bg-gold-500 text-stone-950' : 'bg-stone-800 text-stone-500'}`}
              >
                {s}
              </div>
              {s < 3 && (
                <div className={`w-12 h-px ${step > s ? 'bg-gold-500' : 'bg-stone-700'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div className="card-glass p-8 space-y-7 animate-fade-in">
            <h2 className="font-serif text-2xl text-stone-200">Your Preferences</h2>

            <SingleSelect label="Gender Orientation" options={GENDERS} selected={prefs.gender} onChange={update('gender')} />
            <MultiSelect label="Occasions" options={OCCASIONS} selected={prefs.occasions} onChange={update('occasions')} />
            <MultiSelect label="Seasons" options={SEASONS} selected={prefs.seasons} onChange={update('seasons')} />
            <MultiSelect label="Mood & Vibe" options={MOODS} selected={prefs.mood} onChange={update('mood')} />

            <button onClick={() => setStep(2)} className="btn-gold w-full">
              Continue →
            </button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="card-glass p-8 space-y-7 animate-fade-in">
            <h2 className="font-serif text-2xl text-stone-200">Fragrance Profile</h2>

            <MultiSelect label="Fragrance Families You Like" options={FAMILIES} selected={prefs.families} onChange={update('families')} />
            <SingleSelect label="Preferred Intensity" options={INTENSITIES} selected={prefs.intensity} onChange={update('intensity')} />

            <div>
              <p className="text-sm text-stone-400 mb-2">
                Your Budget <span className="text-stone-600">(in ₹INR)</span>
              </p>
              <div className="flex flex-wrap gap-2 mb-3">
                {BUDGET_PRESETS.map((opt) => {
                  const isSelected = !customBudget && prefs.budget_inr === opt.value
                  return (
                    <button
                      key={opt.label}
                      onClick={() => { update('budget_inr')(opt.value); setCustomBudget('') }}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-all
                        ${isSelected
                          ? 'bg-gold-500/20 border-gold-500/50 text-gold-300'
                          : 'border-stone-700/50 text-stone-400 hover:border-stone-600 hover:text-stone-200'
                        }`}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-stone-500 text-sm">Or enter custom max ₹</span>
                <input
                  type="number"
                  min="0"
                  step="500"
                  inputMode="numeric"
                  placeholder="e.g. 7500"
                  value={customBudget}
                  onChange={(e) => {
                    setCustomBudget(e.target.value)
                    if (e.target.value) update('budget_inr')(null)
                  }}
                  className="input-field max-w-[160px]"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-stone-400 block mb-2">
                Notes You Love <span className="text-stone-600">(comma-separated)</span>
              </label>
              <input
                className="input-field"
                placeholder="e.g. rose, vanilla, oud, bergamot, sandalwood"
                value={prefs.notes_liked}
                onChange={(e) => update('notes_liked')(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm text-stone-400 block mb-2">
                Notes to Avoid <span className="text-stone-600">(comma-separated)</span>
              </label>
              <input
                className="input-field"
                placeholder="e.g. musk, patchouli, animalic"
                value={prefs.notes_disliked}
                onChange={(e) => update('notes_disliked')(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm text-stone-400 block mb-2">
                Anything else? <span className="text-stone-600">(free-form description)</span>
              </label>
              <textarea
                className="input-field resize-none"
                rows={3}
                placeholder="e.g. I want something warm and cozy for winter date nights, not too sweet..."
                value={prefs.free_text}
                onChange={(e) => update('free_text')(e.target.value)}
              />
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="btn-outline flex-1">← Back</button>
              <button onClick={submit} disabled={loading} className="btn-gold flex-1">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                    Analysing...
                  </span>
                ) : 'Find My Perfumes →'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Results */}
        {step === 3 && (
          <div className="animate-fade-in">
            <div className="card-glass p-6 mb-8">
              <h2 className="font-serif text-2xl text-stone-200 mb-3">Your AI Recommendations</h2>
              {usedBudget != null && (
                <p className="text-gold-300 text-sm mb-2">
                  Filtered to your budget: <span className="font-semibold">₹{usedBudget.toLocaleString('en-IN')} max</span>
                </p>
              )}
              <p className="text-stone-400 text-sm leading-relaxed whitespace-pre-line">{summary}</p>
            </div>

            {designerResults.length === 0 && middleEasternResults.length === 0 && (
              <div className="card-glass p-6 text-center text-stone-400">
                No perfumes matched all your filters
                {usedBudget != null && <> within <span className="text-gold-300">₹{usedBudget.toLocaleString('en-IN')}</span></>}
                . Try raising the budget or removing a disliked note.
              </div>
            )}

            {designerResults.length > 0 && (
              <section className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="font-serif text-xl text-stone-100">Designer Picks</h3>
                  <span className="text-xs text-stone-500">{designerResults.length} match{designerResults.length === 1 ? '' : 'es'}</span>
                  <div className="flex-1 h-px bg-stone-700/50" />
                </div>
                <div className="space-y-4">
                  {designerResults.map((p, i) => (
                    <PerfumeCard key={p.id} perfume={p} rank={i + 1} />
                  ))}
                </div>
              </section>
            )}

            {middleEasternResults.length > 0 && (
              <section className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="font-serif text-xl text-stone-100">Middle Eastern Picks</h3>
                  <span className="text-xs text-stone-500">{middleEasternResults.length} match{middleEasternResults.length === 1 ? '' : 'es'}</span>
                  <div className="flex-1 h-px bg-stone-700/50" />
                </div>
                <div className="space-y-4">
                  {middleEasternResults.map((p, i) => (
                    <PerfumeCard key={p.id} perfume={p} rank={i + 1} />
                  ))}
                </div>
              </section>
            )}

            <button
              onClick={() => {
                setStep(1)
                setDesignerResults([])
                setMiddleEasternResults([])
                setSummary('')
                setUsedBudget(null)
              }}
              className="btn-outline w-full mt-4"
            >
              Start Over
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
