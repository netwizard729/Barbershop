import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Scissors } from 'lucide-react'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', first_name: '', last_name: '', phone: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!form.username || !form.password || !form.first_name) {
      toast.error('Please fill required fields')
      return
    }
    setLoading(true)
    try {
      await register(form)
      toast.success('Account created! Please sign in.')
      navigate('/login')
    } catch (err) {
      const errors = err.response?.data
      if (errors) {
        const msg = Object.values(errors).flat().join(', ')
        toast.error(msg)
      } else {
        toast.error('Registration failed')
      }
    } finally {
      setLoading(false)
    }
  }

  const f = (field) => ({
    value: form[field],
    onChange: e => setForm(p => ({...p, [field]: e.target.value}))
  })

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Scissors size={24} className="text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold">Create account</h1>
          <p className="text-gray-400 mt-2">Track your bookings and book faster</p>
        </div>
        
        <div className="card space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">First Name *</label>
              <input className="input" placeholder="John" {...f('first_name')} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Last Name</label>
              <input className="input" placeholder="Doe" {...f('last_name')} />
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Username *</label>
            <input className="input" placeholder="johndoe" {...f('username')} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Phone</label>
            <input className="input" placeholder="+1 555 000 0000" {...f('phone')} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Email</label>
            <input type="email" className="input" placeholder="john@example.com" {...f('email')} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Password *</label>
            <input type="password" className="input" placeholder="Min. 6 characters" {...f('password')} />
          </div>
          <button className="btn-primary w-full mt-2" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creating...' : 'Create Account'}
          </button>
          <p className="text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-400 hover:text-brand-300">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
