import { Link, useLocation } from 'react-router-dom'

const NAV = [
  { to: '/', label: 'Home' },
  { to: '/discover', label: 'How It Works' },
  { to: '/chat', label: 'AI Consultant' },
  { to: '/explore', label: 'Explore' },
]

export default function Header() {
  const { pathname } = useLocation()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-stone-50/90 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="font-serif text-xl tracking-wide text-stone-900">
          Scentique
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`px-4 py-2 rounded-lg text-sm transition-all duration-200
                ${pathname === to
                  ? 'text-stone-900 font-medium'
                  : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
                }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <Link to="/discover" className="btn-primary text-sm px-5 py-2.5">
          Get Started
        </Link>
      </div>
    </header>
  )
}
