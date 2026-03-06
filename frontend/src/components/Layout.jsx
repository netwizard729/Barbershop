import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Scissors, LayoutDashboard, Calendar, LogOut, LogIn, Menu, X } from 'lucide-react'
import { useState } from 'react'

export default function Layout() {
  const { user, logout, isStaff } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/') }
  const isActive = (path) => location.pathname === path

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="border-b border-dark-600 bg-dark-800/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center group-hover:bg-brand-400 transition-colors">
              <Scissors size={16} className="text-white" />
            </div>
            <span className="font-display font-semibold text-lg text-white">BarberBook</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-2">
            <Link to="/" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/') ? 'text-brand-400' : 'text-gray-400 hover:text-white'}`}>Home</Link>
            <Link to="/book" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/book') ? 'text-brand-400' : 'text-gray-400 hover:text-white'}`}>Book Now</Link>
            {user && !isStaff && (
              <Link to="/my-bookings" className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/my-bookings') ? 'text-brand-400' : 'text-gray-400 hover:text-white'}`}>My Bookings</Link>
            )}
            {isStaff && (
              <Link to="/dashboard" className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive('/dashboard') ? 'text-brand-400' : 'text-gray-400 hover:text-white'}`}>
                <LayoutDashboard size={15}/> Dashboard
              </Link>
            )}
            {user ? (
              <button onClick={handleLogout} className="flex items-center gap-1.5 btn-ghost text-sm !px-4 !py-2 ml-2">
                <LogOut size={14}/> Sign Out
              </button>
            ) : (
              <Link to="/login" className="btn-primary text-sm !px-4 !py-2 ml-2 flex items-center gap-1.5">
                <LogIn size={14}/> Sign In
              </Link>
            )}
          </nav>

          {/* Mobile menu toggle */}
          <button className="md:hidden p-2 text-gray-400" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={20}/> : <Menu size={20}/>}
          </button>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div className="md:hidden border-t border-dark-600 bg-dark-800 px-4 py-3 flex flex-col gap-2">
            <Link to="/" className="text-gray-300 py-2" onClick={() => setMenuOpen(false)}>Home</Link>
            <Link to="/book" className="text-gray-300 py-2" onClick={() => setMenuOpen(false)}>Book Now</Link>
            {user && !isStaff && <Link to="/my-bookings" className="text-gray-300 py-2" onClick={() => setMenuOpen(false)}>My Bookings</Link>}
            {isStaff && <Link to="/dashboard" className="text-gray-300 py-2" onClick={() => setMenuOpen(false)}>Dashboard</Link>}
            {user ? (
              <button onClick={() => { handleLogout(); setMenuOpen(false) }} className="text-left text-red-400 py-2">Sign Out</button>
            ) : (
              <Link to="/login" className="text-brand-400 py-2" onClick={() => setMenuOpen(false)}>Sign In</Link>
            )}
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-dark-600 bg-dark-800 py-6 text-center text-gray-500 text-sm">
        <p>© 2024 BarberBook. Walk-ins welcome, reservations preferred.</p>
      </footer>
    </div>
  )
}
