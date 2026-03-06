import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Calendar, Clock, Scissors } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/api'
import LoadingSpinner from '../components/LoadingSpinner'
import { Link } from 'react-router-dom'

const STATUS_COLORS = {
  confirmed: 'badge-confirmed',
  pending: 'badge-pending',
  completed: 'badge-completed',
  cancelled: 'badge-cancelled',
  in_progress: 'badge-in_progress',
  no_show: 'badge-no_show',
}

function formatTime(t) {
  if (!t) return ''
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  return `${hour > 12 ? hour - 12 : hour}:${m} ${hour >= 12 ? 'PM' : 'AM'}`
}

export default function MyBookingsPage() {
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    api.get('/appointments/bookings/').then(r => setAppointments(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const cancel = async (id) => {
    if (!confirm('Cancel this appointment?')) return
    try {
      await api.delete(`/appointments/bookings/${id}/`)
      toast.success('Appointment cancelled')
      load()
    } catch {
      toast.error('Failed to cancel')
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-display font-bold mb-2">My Bookings</h1>
      <p className="text-gray-400 mb-8">Your appointment history</p>

      {appointments.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <Scissors size={40} className="mx-auto mb-4 opacity-30" />
          <p className="mb-4">No appointments yet.</p>
          <Link to="/book" className="btn-primary">Book Your First Cut</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map(a => (
            <div key={a.id} className="card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{a.service_detail?.name}</h3>
                  <span className={STATUS_COLORS[a.status] + ' mt-1 inline-block'}>{a.status}</span>
                </div>
                <div className="text-right">
                  <div className="text-brand-400 font-semibold">${a.service_detail?.price}</div>
                  <div className="text-gray-400 text-sm">{a.service_detail?.duration_minutes}min</div>
                </div>
              </div>
              
              <div className="flex gap-4 text-sm text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Calendar size={14}/>
                  {format(new Date(a.date + 'T12:00:00'), 'EEE, MMM d, yyyy')}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock size={14}/>
                  {formatTime(a.start_time)}
                </span>
              </div>

              {a.notes && <p className="text-xs text-gray-500 mt-2">📝 {a.notes}</p>}

              {a.status === 'confirmed' && (
                <button onClick={() => cancel(a.id)} className="mt-4 text-sm text-red-400 hover:text-red-300 transition-colors">
                  Cancel appointment
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
