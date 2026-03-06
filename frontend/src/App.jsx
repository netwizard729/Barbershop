import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import BookPage from './pages/BookPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import MyBookingsPage from './pages/MyBookingsPage'
import DashboardPage from './pages/DashboardPage'
import LoadingSpinner from './components/LoadingSpinner'

function ProtectedRoute({ children, staffOnly = false }) {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to="/login" replace />
  if (staffOnly && user.role === 'customer') return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/book" element={<BookPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/my-bookings" element={
          <ProtectedRoute><MyBookingsPage /></ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute staffOnly><DashboardPage /></ProtectedRoute>
        } />
      </Route>
    </Routes>
  )
}
