import { Link } from 'react-router-dom'

const HERO_IMG = '/images/ChatGPT Image May 28, 2026, 10_54_42 AM.png'

const FEATURES = [
  {
    icon: '◈',
    title: 'Content-Based AI',
    desc: 'ML models analyse fragrance profiles using TF-IDF and cosine similarity across 50+ perfumes.',
  },
  {
    icon: '◉',
    title: 'Semantic RAG Search',
    desc: 'Sentence-transformer embeddings + ChromaDB vector store for deep semantic perfume matching.',
  },
  {
    icon: '◇',
    title: 'Agentic Claude AI',
    desc: 'Claude reasons through your preferences using tool-use to search, filter, and explain recommendations.',
  },
]

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero — teal scene */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(120deg, #2d6e7e 0%, #3d8898 35%, #4f9aaa 100%)', minHeight: '92vh' }}
      >
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-stretch" style={{ minHeight: '92vh' }}>

          {/* Left: copy */}
          <div className="flex-1 flex flex-col justify-center pt-24 pb-16 md:py-0 relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 border border-white/25 text-white/80 text-xs font-medium mb-8 uppercase tracking-widest w-fit">
              <span>✦</span> AI-Powered Fragrance Discovery
            </div>

            <h1 className="font-serif text-5xl md:text-6xl xl:text-7xl text-white mb-6 leading-tight">
              Discover your<br />
              <em className="italic font-normal text-white/90">perfect</em> scent
            </h1>

            <p className="text-white/70 text-base md:text-lg max-w-md mb-10 leading-relaxed">
              Scentique uses AI to match fragrances to your personality, mood, and lifestyle — uniquely curated for you.
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-4">
              <Link
                to="/discover"
                className="bg-white text-stone-900 text-sm font-semibold px-7 py-3.5 rounded-full hover:bg-white/90 transition-all duration-300 shadow-lg"
              >
                Discover My Perfume
              </Link>
              <Link
                to="/chat"
                className="border border-white/50 text-white text-sm font-medium px-7 py-3.5 rounded-full hover:bg-white/15 transition-all duration-300"
              >
                Chat with AI
              </Link>
            </div>
          </div>

          {/* Right: composite product shot — edges fade into hero bg */}
          <div className="flex-none w-full md:w-[52%] relative overflow-hidden">
            <img
              src={HERO_IMG}
              alt="Perfume bottle with lime and wood ingredients"
              className="absolute inset-0 w-full h-full object-cover object-center select-none"
              style={{
                maskImage: 'linear-gradient(to right, transparent 0%, black 20%)',
                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 20%)',
              }}
            />
          </div>
        </div>

        {/* Fade into dark sections below */}
        <div
          className="absolute bottom-0 left-0 right-0 h-28 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, #0c0a09)' }}
        />
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-stone-950">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-serif text-3xl text-center text-stone-200 mb-4">
            How Scentique Works
          </h2>
          <p className="text-stone-500 text-center mb-14 max-w-xl mx-auto">
            Three layers of intelligence working together to find your perfect match.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map(({ icon, title, desc }) => (
              <div key={title} className="card-glass p-6 hover:border-gold-500/30 transition-colors">
                <div className="text-3xl text-gold-400 mb-4">{icon}</div>
                <h3 className="font-semibold text-stone-200 mb-2">{title}</h3>
                <p className="text-stone-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-stone-950">
        <div className="max-w-2xl mx-auto text-center card-glass p-12">
          <h2 className="font-serif text-3xl text-stone-100 mb-4">
            Ready to find your scent?
          </h2>
          <p className="text-stone-400 mb-8">
            Take our preference quiz or chat with our AI consultant for a personalised experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/discover" className="btn-gold">Start the Quiz</Link>
            <Link to="/explore" className="btn-outline">Browse All Perfumes</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
