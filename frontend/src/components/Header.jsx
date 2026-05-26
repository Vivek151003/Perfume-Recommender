import { Link, useLocation } from 'react-router-dom'

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/discover', label: 'Discover' },
  { to: '/chat', label: 'AI Consultant' },
  { to: '/explore', label: 'Explore' },
]

export default function Header() {
  const { pathname } = useLocation()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-stone-950/80 backdrop-blur-md border-b border-stone-800/60">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="text-2xl">✦</span>
          <span className="font-serif text-xl tracking-wide text-gold-400">Scentique</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${pathname === to
                  ? 'bg-gold-500/15 text-gold-400'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
                }`}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}
