import { useState, useEffect } from 'react'
import { format, addDays, isToday, isTomorrow } from 'date-fns'
import { Clock, Scissors, CheckCircle, User, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/api'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAuth } from '../context/AuthContext'

const STEPS = ['Date', 'Barber', 'Service', 'Time', 'Details', 'Confirm']

function StepBar({ current }) {
  return (
    <div className="flex items-center justify-center gap-1 mb-3 shrink-0 flex-wrap">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-1">
          <div className={`flex items-center gap-1.5 ${i <= current ? 'text-brand-400' : 'text-gray-600'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold border ${i < current ? 'bg-brand-500 border-brand-500 text-white' : i === current ? 'border-brand-500 text-brand-400' : 'border-dark-500'}`}>
              {i < current ? '✓' : i + 1}
            </div>
            <span className="text-xs font-medium hidden sm:block">{label}</span>
          </div>
          {i < STEPS.length - 1 && <div className={`w-5 h-px ${i < current ? 'bg-brand-500' : 'bg-dark-500'}`} />}
        </div>
      ))}
    </div>
  )
}

function BarberAvatar({ barber, selected, onClick }) {
  const initials = barber.full_name
    ? barber.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : barber.username[0].toUpperCase()

  return (
    <button
      onClick={onClick}
      className={`w-full p-4 rounded-xl text-left border transition-all flex items-center gap-4
        ${selected ? 'border-brand-500 bg-brand-500/10' : 'border-dark-500 bg-dark-700 hover:border-brand-500/50'}`}
    >
      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0
        ${selected ? 'bg-brand-500 text-white' : 'bg-dark-600 text-brand-400'}`}>
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm">{barber.full_name || barber.username}</div>
        {barber.bio
          ? <div className="text-gray-400 text-xs mt-0.5 truncate">{barber.bio}</div>
          : <div className="text-gray-500 text-xs mt-0.5">Barber</div>
        }
      </div>
      {selected && <div className="text-brand-400 text-lg shrink-0">✓</div>}
    </button>
  )
}

export default function BookPage() {
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [barbers, setBarbers] = useState([])
  const [selectedBarber, setSelectedBarber] = useState(null)
  const [services, setServices] = useState([])
  const [selectedService, setSelectedService] = useState(null)
  const [slots, setSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [form, setForm] = useState({ customer_name: '', customer_phone: '', notes: '' })
  const [booking, setBooking] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f,
        customer_name: user.first_name ? `${user.first_name} ${user.last_name}`.trim() : user.username,
        customer_phone: user.phone || '',
      }))
    }
  }, [user])

  useEffect(() => {
    api.get('/auth/barbers/').then(r => setBarbers(r.data))
    api.get('/appointments/services/').then(r => setServices(r.data))
  }, [])

  useEffect(() => {
    if (!selectedService) return
    setSlotsLoading(true)
    setSelectedSlot(null)
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    const params = `?date=${dateStr}&service_id=${selectedService.id}${selectedBarber ? `&barber_id=${selectedBarber.id}` : ''}`
    api.get(`/appointments/slots/${params}`)
      .then(r => setSlots(r.data.slots))
      .catch(() => setSlots([]))
      .finally(() => setSlotsLoading(false))
  }, [selectedDate, selectedService, selectedBarber])

  const dateLabel = (d) => {
    if (isToday(d)) return 'Today'
    if (isTomorrow(d)) return 'Tomorrow'
    return format(d, 'EEE, MMM d')
  }

  const handleSubmit = async () => {
    if (!form.customer_name || !form.customer_phone) {
      toast.error('Please fill in your name and phone number')
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        customer_name: form.customer_name,
        customer_phone: form.customer_phone,
        service: selectedService.id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        start_time: selectedSlot + ':00',
        notes: form.notes,
        ...(selectedBarber ? { barber: selectedBarber.id } : {}),
      }
      const { data } = await api.post('/appointments/bookings/', payload)
      setBooking(data)
      setStep(6)
      toast.success('Booking confirmed!')
    } catch (err) {
      const msg = err.response?.data?.non_field_errors?.[0] ||
                  err.response?.data?.detail ||
                  'Booking failed. Please try another slot.'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const resetAll = () => {
    setStep(0); setSelectedService(null); setSelectedSlot(null)
    setSelectedBarber(null); setBooking(null)
  }

  // Success screen
  if (step === 6 && booking) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="card w-full max-w-md">
          <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={28} className="text-green-400" />
          </div>
          <h2 className="text-2xl font-display font-bold mb-1 text-center">You're booked!</h2>
          <p className="text-gray-400 mb-4 text-center text-sm">See you at the shop.</p>
          <div className="bg-dark-700 rounded-lg p-4 text-left space-y-2 mb-4">
            <Row label="Name"     value={booking.customer_name} />
            <Row label="Barber"   value={booking.barber_detail ? (booking.barber_detail.full_name || booking.barber_detail.username) : 'Any available'} />
            <Row label="Service"  value={booking.service_detail?.name} />
            <Row label="Date"     value={format(new Date(booking.date + 'T12:00:00'), 'EEE, MMM d, yyyy')} />
            <Row label="Time"     value={formatTime(booking.start_time)} />
            <Row label="Duration" value={`${booking.service_detail?.duration_minutes} min`} />
            <Row label="Price"    value={`$${booking.service_detail?.price}`} />
          </div>
          <div className="bg-brand-500/10 border border-brand-500/20 rounded-lg p-3 text-xs text-brand-300 mb-4 text-center">
            📱 Note down your booking time — we'll see you then!
          </div>
          <button onClick={resetAll} className="btn-secondary w-full">Book Another</button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col px-4 py-4 max-w-2xl mx-auto w-full">
      <div className="mb-2 shrink-0">
        <h1 className="text-2xl font-display font-bold">Book Your Appointment</h1>
        <p className="text-gray-400 text-sm mt-0.5">Choose a time that works for you.</p>
      </div>

      <div className="shrink-0">
        <StepBar current={step} />
      </div>

      <div className="card flex-1 flex flex-col min-h-0 overflow-hidden">

        {/* Step 0: Date */}
        {step === 0 && (
          <div className="flex flex-col h-full">
            <h2 className="text-base font-display font-semibold mb-3 flex items-center gap-2 shrink-0">
              <Clock size={17} className="text-brand-400"/> Select Date
            </h2>
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 pb-1">
                {Array.from({ length: 14 }, (_, i) => addDays(new Date(), i)).map(d => {
                  const active = format(d, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
                  return (
                    <button key={d} onClick={() => setSelectedDate(d)}
                      className={`py-2 px-1 rounded-lg text-center transition-all border ${active ? 'bg-brand-500 border-brand-500 text-white' : 'bg-dark-700 border-dark-500 text-gray-300 hover:border-brand-500/50'}`}>
                      <div className="text-xs opacity-70">{format(d, 'EEE')}</div>
                      <div className="text-base font-semibold leading-tight">{format(d, 'd')}</div>
                      <div className="text-xs">{format(d, 'MMM')}</div>
                      {isToday(d) && <div className="text-xs text-brand-300 mt-0.5 leading-tight">Today</div>}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="flex justify-end pt-3 shrink-0">
              <button className="btn-primary" onClick={() => setStep(1)}>Continue →</button>
            </div>
          </div>
        )}

        {/* Step 1: Barber */}
        {step === 1 && (
          <div className="flex flex-col h-full">
            <h2 className="text-base font-display font-semibold mb-1 flex items-center gap-2 shrink-0">
              <Users size={17} className="text-brand-400"/> Choose Your Barber
            </h2>
            <p className="text-gray-400 text-xs mb-3 shrink-0">Pick who you'd like to work with, or skip to choose any available barber.</p>
            <div className="flex-1 overflow-y-auto min-h-0 space-y-2 pr-0.5">
              {/* "Any" option */}
              <button
                onClick={() => { setSelectedBarber(null); setStep(2) }}
                className={`w-full p-4 rounded-xl text-left border transition-all flex items-center gap-4
                  ${!selectedBarber ? 'border-brand-500 bg-brand-500/10' : 'border-dark-500 bg-dark-700 hover:border-brand-500/50'}`}
              >
                <div className="w-12 h-12 rounded-full bg-dark-600 flex items-center justify-center text-lg shrink-0">🎲</div>
                <div>
                  <div className="font-semibold text-sm">Any Available Barber</div>
                  <div className="text-gray-400 text-xs mt-0.5">We'll assign whoever's free</div>
                </div>
              </button>
              {barbers.map(b => (
                <BarberAvatar key={b.id} barber={b} selected={selectedBarber?.id === b.id}
                  onClick={() => { setSelectedBarber(b); setStep(2) }} />
              ))}
            </div>
            <div className="flex gap-3 pt-3 shrink-0">
              <button className="btn-secondary" onClick={() => setStep(0)}>← Back</button>
            </div>
          </div>
        )}

        {/* Step 2: Service */}
        {step === 2 && (
          <div className="flex flex-col h-full">
            <h2 className="text-base font-display font-semibold mb-3 flex items-center gap-2 shrink-0">
              <Scissors size={17} className="text-brand-400"/> Select Service
            </h2>
            <div className="flex-1 overflow-y-auto min-h-0 space-y-2 pr-0.5">
              {services.map(s => (
                <button key={s.id} onClick={() => { setSelectedService(s); setStep(3) }}
                  className={`w-full p-3 rounded-lg text-left border transition-all flex items-center justify-between
                    ${selectedService?.id === s.id ? 'border-brand-500 bg-brand-500/10' : 'border-dark-500 bg-dark-700 hover:border-brand-500/50'}`}>
                  <div>
                    <div className="font-semibold text-sm">{s.name}</div>
                    <div className="text-gray-400 text-xs">{s.duration_minutes} minutes</div>
                  </div>
                  <div className="text-brand-400 font-semibold">${s.price}</div>
                </button>
              ))}
            </div>
            <div className="flex gap-3 pt-3 shrink-0">
              <button className="btn-secondary" onClick={() => setStep(1)}>← Back</button>
            </div>
          </div>
        )}

        {/* Step 3: Time slot */}
        {step === 3 && (
          <div className="flex flex-col h-full">
            <div className="shrink-0 mb-3">
              <h2 className="text-base font-display font-semibold flex items-center gap-2">
                <Clock size={17} className="text-brand-400"/> Pick a Time
              </h2>
              <p className="text-gray-400 text-xs mt-0.5">
                {dateLabel(selectedDate)} · {selectedService?.name}
                {selectedBarber && <span className="text-brand-400"> · {selectedBarber.full_name || selectedBarber.username}</span>}
              </p>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              {slotsLoading ? <LoadingSpinner /> : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pb-1">
                  {slots.map(slot => (
                    <button key={slot.time} disabled={!slot.is_available}
                      onClick={() => { setSelectedSlot(slot.time); setStep(4) }}
                      className={`p-2.5 rounded-lg text-center text-sm font-medium border transition-all
                        ${!slot.is_available ? 'opacity-30 cursor-not-allowed border-dark-600 bg-dark-700' :
                          selectedSlot === slot.time ? 'bg-brand-500 border-brand-500 text-white' :
                          'border-dark-500 bg-dark-700 hover:border-brand-500 text-gray-300'}`}>
                      <div className="text-xs font-semibold">{slot.time_display}</div>
                      {slot.is_available && <div className="text-xs mt-0.5 opacity-60">{slot.available_chairs} open</div>}
                      {slot.is_past && <div className="text-xs mt-0.5 text-gray-500">Past</div>}
                      {!slot.is_available && !slot.is_past && <div className="text-xs mt-0.5 text-red-400">Full</div>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-3 shrink-0">
              <button className="btn-secondary" onClick={() => setStep(2)}>← Back</button>
            </div>
          </div>
        )}

        {/* Step 4: Customer details */}
        {step === 4 && (
          <div className="flex flex-col h-full">
            <h2 className="text-base font-display font-semibold mb-3 flex items-center gap-2 shrink-0">
              <User size={17} className="text-brand-400"/> Your Details
            </h2>
            <div className="flex-1 overflow-y-auto min-h-0 space-y-3 pr-0.5">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Full Name *</label>
                <input className="input" placeholder="John Doe" value={form.customer_name}
                  onChange={e => setForm(f => ({...f, customer_name: e.target.value}))} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Phone Number *</label>
                <input className="input" placeholder="+1 555 000 0000" value={form.customer_phone}
                  onChange={e => setForm(f => ({...f, customer_phone: e.target.value}))} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Notes (optional)</label>
                <textarea className="input resize-none h-16" placeholder="Any specific requests..." value={form.notes}
                  onChange={e => setForm(f => ({...f, notes: e.target.value}))} />
              </div>
            </div>
            <div className="flex gap-3 pt-3 shrink-0">
              <button className="btn-secondary" onClick={() => setStep(3)}>← Back</button>
              <button className="btn-primary flex-1" onClick={() => setStep(5)}
                disabled={!form.customer_name || !form.customer_phone}>
                Review Booking →
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Confirm */}
        {step === 5 && (
          <div className="flex flex-col h-full">
            <h2 className="text-base font-display font-semibold mb-3 shrink-0">Review & Confirm</h2>
            <div className="flex-1 overflow-y-auto min-h-0">
              <div className="bg-dark-700 rounded-lg p-4 space-y-2.5">
                <Row label="Date"     value={format(selectedDate, 'EEE, MMM d, yyyy')} />
                <Row label="Time"     value={formatTime(selectedSlot + ':00')} />
                <Row label="Barber"   value={selectedBarber ? (selectedBarber.full_name || selectedBarber.username) : 'Any Available'} />
                <Row label="Service"  value={selectedService?.name} />
                <Row label="Duration" value={`${selectedService?.duration_minutes} min`} />
                <Row label="Price"    value={`$${selectedService?.price}`} />
                <div className="border-t border-dark-500 pt-2.5 space-y-2.5">
                  <Row label="Name"   value={form.customer_name} />
                  <Row label="Phone"  value={form.customer_phone} />
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-3 shrink-0">
              <button className="btn-secondary" onClick={() => setStep(4)}>← Back</button>
              <button className="btn-primary flex-1" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Booking...' : 'Confirm Booking ✓'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="font-medium text-sm">{value}</span>
    </div>
  )
}

function formatTime(t) {
  if (!t) return ''
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  return `${hour > 12 ? hour - 12 : hour}:${m} ${hour >= 12 ? 'PM' : 'AM'}`
}
