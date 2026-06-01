import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Home from './pages/Home'
import Discover from './pages/Discover'
import Chat from './pages/Chat'
import Explore from './pages/Explore'

export default function App() {
  return (
    <div className="min-h-screen bg-stone-50">
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/discover" element={<Discover />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/explore" element={<Explore />} />
      </Routes>
    </div>
  )
}
