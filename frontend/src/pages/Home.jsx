import { Link } from 'react-router-dom'

const HERO_IMG = '/images/ChatGPT Image May 28, 2026, 10_54_42 AM.png'

const HOW_IT_WORKS = [
  { step: '1', title: 'Answer Questions', desc: 'Tell us about your preferences, lifestyle, moods, and taste.' },
  { step: '2', title: 'AI Analyses', desc: 'Our AI analyzes your answers to understand your unique scent profile.' },
  { step: '3', title: 'Get Recommendations', desc: 'We recommend fragrances perfectly matched to your personality.' },
  { step: '4', title: 'Discover & Enjoy', desc: 'Explore, try, and find your signature scent with confidence.' },
]

const FEATURES = [
  {
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>,
    title: 'Personalised for You',
    desc: 'Every recommendation is uniquely tailored to your individual taste.',
  },
  {
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    title: 'Top Quality Brands',
    desc: 'Handpicked fragrances from the most trusted brands worldwide.',
  },
  {
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>,
    title: 'Expert Curation',
    desc: 'Our AI is trained on thousands of fragrance reviews and expert opinions.',
  },
  {
    icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>,
    title: 'Your Data is Safe',
    desc: 'We never store personal data. 100% private and secure by design.',
  },
]

export default function Home() {
  return (
    <main className="min-h-screen">

      {/* ── Hero ── */}
      <section className="min-h-screen bg-stone-50 flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full pt-16">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8" style={{ minHeight: 'calc(100vh - 4rem)' }}>

            {/* Left: copy */}
            <div className="flex-1 flex flex-col justify-center py-20 lg:py-0">
              <h1 className="font-serif text-5xl md:text-6xl xl:text-[4.25rem] text-stone-900 mb-6 leading-[1.1] tracking-tight">
                Find the scent<br />
                that's <em className="italic font-normal">truly</em> you.
              </h1>

              <p className="text-stone-500 text-lg max-w-md mb-10 leading-relaxed">
                Answer a few simple questions about your preferences and let our AI find your perfect match.
              </p>

              <div className="flex flex-col sm:flex-row items-start gap-3 mb-12">
                <Link to="/discover" className="btn-primary text-sm px-6 py-3.5">
                  Get Started →
                </Link>
                <Link to="/explore" className="btn-outline text-sm px-6 py-3.5">
                  Explore Fragrances
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap gap-6">
                {['AI-Powered Recommendations', 'Curated from Top Brands', '100% Private & Secure'].map((label) => (
                  <div key={label} className="flex items-center gap-2 text-stone-500 text-sm">
                    <span className="w-4 h-4 rounded-full bg-stone-200 flex items-center justify-center text-stone-600 text-[10px] font-bold">✓</span>
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Right: perfume bottle + match card */}
            <div className="flex-none w-full lg:w-[48%] relative flex items-center justify-center py-12 lg:py-20">
              {/* Warm circle bg */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[400px] h-[400px] rounded-full" style={{ background: '#F5EFE6' }} />
              </div>

              {/* Perfume bottle */}
              <div className="relative z-10">
                <img
                  src={HERO_IMG}
                  alt="Perfume bottle"
                  className="w-56 h-72 object-contain drop-shadow-xl animate-float"
                />
              </div>

              {/* Match card */}
              <div className="absolute bottom-8 right-2 lg:right-8 z-20 bg-white rounded-2xl shadow-lg border border-stone-200 p-4 w-52">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-stone-900 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
                    </svg>
                  </div>
                  <span className="text-xs font-semibold text-stone-800">Your Match</span>
                </div>
                <p className="text-[11px] text-stone-500 mb-2">Based on your preferences, we recommend</p>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-12 bg-stone-100 rounded-lg flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-stone-900 leading-tight">Rose of No Man's Land</p>
                    <p className="text-[10px] text-stone-500 mt-0.5">BYREDO</p>
                    <div className="flex items-center gap-0.5 mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <svg key={i} className={`w-2.5 h-2.5 ${i < 4 ? 'text-amber-400' : 'text-stone-200'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <span className="text-[10px] text-stone-500 ml-1">4.1</span>
                    </div>
                  </div>
                </div>
                <button className="mt-3 text-[11px] text-stone-500 hover:text-stone-900 transition-colors underline underline-offset-2">
                  See more recommendations →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-serif text-3xl md:text-4xl text-stone-900 mb-4">How It Works</h2>
            <p className="text-stone-500 max-w-md mx-auto">Finding your perfect scent is simple.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {HOW_IT_WORKS.map(({ step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-stone-900 text-white flex items-center justify-center font-semibold text-lg mx-auto mb-4">
                  {step}
                </div>
                <h3 className="font-semibold text-stone-800 mb-2">{title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20 px-6 bg-stone-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map(({ icon, title, desc }) => (
              <div key={title} className="card p-6">
                <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center text-stone-700 mb-4">
                  {icon}
                </div>
                <h3 className="font-semibold text-stone-800 mb-2">{title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-3xl md:text-4xl text-stone-900 mb-4">
            Ready to find your scent?
          </h2>
          <p className="text-stone-500 mb-10 leading-relaxed">
            Take our quick preference quiz or chat with our AI consultant for a personalised experience.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/discover" className="btn-primary">Start the Quiz →</Link>
            <Link to="/explore" className="btn-outline">Browse All Perfumes</Link>
          </div>
        </div>
      </section>

    </main>
  )
}
