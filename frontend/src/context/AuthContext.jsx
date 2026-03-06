import { createContext, useContext, useState, useEffect } from 'react'
import api from '../utils/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      api.get('/auth/me/')
        .then(r => setUser(r.data))
        .catch(() => localStorage.clear())
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (username, password) => {
    const { data } = await api.post('/auth/login/', { username, password })
    localStorage.setItem('access_token', data.access)
    localStorage.setItem('refresh_token', data.refresh)
    setUser(data.user)
    return data.user
  }

  const register = async (formData) => {
    const { data } = await api.post('/auth/register/', formData)
    return data
  }

  const logout = () => {
    localStorage.clear()
    setUser(null)
  }

  const isOwner = user?.role === 'owner'
  const isStaff = user?.role === 'owner' || user?.role === 'barber'

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isOwner, isStaff }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
