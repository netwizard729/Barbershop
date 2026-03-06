import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Scissors } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login, isStaff } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!form.username || !form.password) { toast.error('Fill all fields'); return }
    setLoading(true)
    try {
      const user = await login(form.username, form.password)
      toast.success(`Welcome back!`)
      navigate(user.role === 'owner' || user.role === 'barber' ? '/dashboard' : '/my-bookings')
    } catch {
      toast.error('Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Scissors size={24} className="text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold">Welcome back</h1>
          <p className="text-gray-400 mt-2">Sign in to manage your bookings</p>
        </div>
        
        <div className="card space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Username</label>
            <input className="input" placeholder="your_username" value={form.username}
              onChange={e => setForm(f => ({...f, username: e.target.value}))}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Password</label>
            <input type="password" className="input" placeholder="••••••••" value={form.password}
              onChange={e => setForm(f => ({...f, password: e.target.value}))}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>
          <button className="btn-primary w-full mt-2" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <p className="text-center text-sm text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-400 hover:text-brand-300">Create one</Link>
          </p>
        </div>

        <p className="text-center text-xs text-gray-600 mt-4">
          No account needed to book — <Link to="/book" className="text-gray-400 hover:text-brand-400">Book as guest</Link>
        </p>
      </div>
    </div>
  )
}
