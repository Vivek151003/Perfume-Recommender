import { Link } from 'react-router-dom'

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
      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        {/* Background orbs */}
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-64 h-64 bg-rose-perfume/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-500/10 border border-gold-500/20 text-gold-400 text-xs font-medium mb-8 uppercase tracking-widest">
            <span>✦</span> AI-Powered Fragrance Discovery
          </div>

          <h1 className="font-serif text-5xl md:text-7xl text-stone-100 mb-6 leading-tight">
            Find Your
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-gold-400 to-gold-200">
              Signature Scent
            </span>
          </h1>

          <p className="text-stone-400 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
            Scentique uses Retrieval-Augmented Generation, content-based ML filtering, and Claude AI
            to recommend the perfect fragrance — uniquely matched to you.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/discover" className="btn-gold text-base">
              Discover My Perfume
            </Link>
            <Link to="/chat" className="btn-outline text-base">
              Chat with AI Consultant
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 border-t border-stone-800/60">
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

      {/* CTA section */}
      <section className="py-20 px-6">
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
