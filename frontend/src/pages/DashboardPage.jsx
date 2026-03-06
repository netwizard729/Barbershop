import { useState, useEffect, useCallback } from 'react'
import { format, addDays, subDays } from 'date-fns'
import {
  ChevronLeft, ChevronRight, Plus, BarChart3, Calendar, Clock,
  CheckCircle, X, Scissors, Pencil, Trash2, Save, AlertTriangle, Users
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../utils/api'
import LoadingSpinner from '../components/LoadingSpinner'

const STATUS_COLORS = {
  confirmed:   'badge-confirmed',
  pending:     'badge-pending',
  completed:   'badge-completed',
  cancelled:   'badge-cancelled',
  in_progress: 'badge-in_progress',
  no_show:     'badge-no_show',
}
const STATUS_LABELS = {
  confirmed:   'Confirmed',
  pending:     'Pending',
  completed:   'Completed',
  cancelled:   'Cancelled',
  in_progress: 'In Progress',
  no_show:     'No Show',
}

// ── Add Appointment Modal ─────────────────────────────────────────────────────
function AddBookingModal({ onClose, onSuccess }) {
  const [services, setServices] = useState([])
  const [barbers, setBarbers] = useState([])
  const [slots, setSlots] = useState([])
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [form, setForm] = useState({
    customer_name: '', customer_phone: '',
    service: '', barber: '', date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '', notes: ''
  })

  useEffect(() => {
    api.get('/appointments/services/').then(r => setServices(r.data))
    api.get('/auth/barbers/').then(r => setBarbers(r.data))
  }, [])

  const loadSlots = (date, serviceId) => {
    if (!date || !serviceId) return
    setSlotsLoading(true)
    api.get(`/appointments/slots/?date=${date}&service_id=${serviceId}`)
      .then(r => setSlots(r.data.slots.filter(s => s.is_available)))
      .finally(() => setSlotsLoading(false))
  }

  const handleChange = (field, value) => {
    const updated = { ...form, [field]: value }
    setForm(updated)
    if (field === 'date' || field === 'service') {
      loadSlots(field === 'date' ? value : form.date, field === 'service' ? value : form.service)
    }
  }

  const handleSubmit = async () => {
    if (!form.customer_name || !form.customer_phone || !form.service || !form.date || !form.start_time) {
      toast.error('Please fill all required fields'); return
    }
    try {
      const payload = { ...form, start_time: form.start_time + ':00' }
      if (!payload.barber) delete payload.barber
      await api.post('/appointments/bookings/', payload)
      toast.success('Appointment added!')
      onSuccess(); onClose()
    } catch (err) {
      toast.error(err.response?.data?.non_field_errors?.[0] || 'Failed to add appointment')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-dark-800 border border-dark-600 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-dark-600">
          <h3 className="text-lg font-display font-semibold">Add Appointment</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={18}/></button>
        </div>
        <div className="p-5 space-y-3">
          {[['Customer Name *', 'customer_name', 'John Doe'],
            ['Phone *', 'customer_phone', '+1 555 000 0000']].map(([label, field, ph]) => (
            <div key={field}>
              <label className="block text-xs text-gray-400 mb-1">{label}</label>
              <input className="input" placeholder={ph} value={form[field]}
                onChange={e => handleChange(field, e.target.value)} />
            </div>
          ))}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Barber</label>
            <select className="input" value={form.barber} onChange={e => handleChange('barber', e.target.value)}>
              <option value="">Any available barber</option>
              {barbers.map(b => <option key={b.id} value={b.id}>{b.full_name || b.username}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Service *</label>
            <select className="input" value={form.service} onChange={e => handleChange('service', e.target.value)}>
              <option value="">Select a service</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.name} ({s.duration_minutes}min) — ${s.price}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Date *</label>
            <input type="date" className="input" value={form.date} onChange={e => handleChange('date', e.target.value)}/>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Time *</label>
            {slotsLoading ? <LoadingSpinner size="sm"/> : (
              <select className="input" value={form.start_time} onChange={e => handleChange('start_time', e.target.value)}>
                <option value="">Select a slot</option>
                {slots.map(s => <option key={s.time} value={s.time}>{s.time_display} ({s.available_chairs} chairs open)</option>)}
              </select>
            )}
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Notes</label>
            <textarea className="input h-16 resize-none" value={form.notes}
              onChange={e => handleChange('notes', e.target.value)} placeholder="Optional notes..."/>
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-dark-600">
          <button className="btn-secondary flex-1" onClick={onClose}>Cancel</button>
          <button className="btn-primary flex-1" onClick={handleSubmit}>Add Appointment</button>
        </div>
      </div>
    </div>
  )
}

// ── Barbers Tab ───────────────────────────────────────────────────────────────
function BarbersTab() {
  const [barbers, setBarbers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [newBarber, setNewBarber] = useState({ first_name: '', last_name: '', username: '', phone: '', bio: '', password: '' })
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    api.get('/auth/barbers/').then(r => setBarbers(r.data)).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const addBarber = async () => {
    if (!newBarber.first_name || !newBarber.username) { toast.error('First name and username are required'); return }
    setSaving(true)
    try {
      await api.post('/auth/barbers/manage/', { ...newBarber, role: 'barber' })
      toast.success('Barber added!')
      setNewBarber({ first_name: '', last_name: '', username: '', phone: '', bio: '', password: '' })
      setShowAdd(false)
      load()
    } catch (err) {
      const d = err.response?.data
      toast.error(d?.username?.[0] || d?.detail || 'Failed to add barber')
    } finally { setSaving(false) }
  }

  const startEdit = (b) => {
    setEditingId(b.id)
    setEditForm({ first_name: b.first_name, last_name: b.last_name, phone: b.phone || '', bio: b.bio || '', password: '' })
  }

  const saveEdit = async (id) => {
    setSaving(true)
    try {
      const payload = { ...editForm }
      if (!payload.password) delete payload.password
      await api.patch(`/auth/barbers/${id}/`, payload)
      toast.success('Barber updated')
      setEditingId(null)
      load()
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  const deleteBarber = async (id, name) => {
    if (!confirm(`Remove ${name} from the team?`)) return
    try {
      await api.delete(`/auth/barbers/${id}/`)
      toast.success('Barber removed')
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to remove barber')
    }
  }

  const initials = (b) => {
    const name = b.full_name || b.username
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  if (loading) return <div className="py-12"><LoadingSpinner /></div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-display font-semibold">Team / Barbers</h2>
          <p className="text-gray-400 text-xs">{barbers.length} staff member{barbers.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary flex items-center gap-1.5 text-sm" onClick={() => setShowAdd(v => !v)}>
          <Plus size={14}/> Add Barber
        </button>
      </div>

      {/* Add barber form */}
      {showAdd && (
        <div className="bg-dark-700 rounded-xl p-4 border border-brand-500/40 space-y-3">
          <h3 className="font-medium text-sm text-brand-400">New Barber</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">First Name *</label>
              <input className="input" placeholder="John" value={newBarber.first_name}
                onChange={e => setNewBarber(f => ({...f, first_name: e.target.value}))} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Last Name</label>
              <input className="input" placeholder="Doe" value={newBarber.last_name}
                onChange={e => setNewBarber(f => ({...f, last_name: e.target.value}))} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Username *</label>
              <input className="input" placeholder="johndoe" value={newBarber.username}
                onChange={e => setNewBarber(f => ({...f, username: e.target.value}))} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Phone</label>
              <input className="input" placeholder="+1 555 000 0000" value={newBarber.phone}
                onChange={e => setNewBarber(f => ({...f, phone: e.target.value}))} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1">Bio (shown to customers)</label>
              <input className="input" placeholder="e.g. Specializes in fades and designs" value={newBarber.bio}
                onChange={e => setNewBarber(f => ({...f, bio: e.target.value}))} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1">Password (leave blank for default: BarberPass1!)</label>
              <input className="input" type="password" placeholder="Set a password" value={newBarber.password}
                onChange={e => setNewBarber(f => ({...f, password: e.target.value}))} />
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-primary text-sm flex items-center gap-1.5" onClick={addBarber} disabled={saving}>
              <Save size={14}/> {saving ? 'Adding…' : 'Add Barber'}
            </button>
            <button className="btn-secondary text-sm" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Barber list */}
      <div className="space-y-2">
        {barbers.length === 0 ? (
          <div className="text-center py-10 text-gray-500 text-sm">No barbers yet. Add your team above.</div>
        ) : barbers.map(b => (
          <div key={b.id}>
            {editingId === b.id ? (
              <div className="bg-dark-700 rounded-xl p-4 border border-brand-500/40 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">First Name</label>
                    <input className="input" value={editForm.first_name}
                      onChange={e => setEditForm(f => ({...f, first_name: e.target.value}))} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Last Name</label>
                    <input className="input" value={editForm.last_name}
                      onChange={e => setEditForm(f => ({...f, last_name: e.target.value}))} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Phone</label>
                    <input className="input" value={editForm.phone}
                      onChange={e => setEditForm(f => ({...f, phone: e.target.value}))} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">New Password (optional)</label>
                    <input className="input" type="password" placeholder="Leave blank to keep current"
                      value={editForm.password} onChange={e => setEditForm(f => ({...f, password: e.target.value}))} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-gray-400 mb-1">Bio</label>
                    <input className="input" placeholder="Short description shown to customers" value={editForm.bio}
                      onChange={e => setEditForm(f => ({...f, bio: e.target.value}))} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-primary text-sm flex items-center gap-1.5" onClick={() => saveEdit(b.id)} disabled={saving}>
                    <Save size={14}/> {saving ? 'Saving…' : 'Save'}
                  </button>
                  <button className="btn-secondary text-sm" onClick={() => setEditingId(null)}>Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4 p-4 rounded-xl border border-dark-500 bg-dark-700">
                <div className="w-11 h-11 rounded-full bg-dark-600 flex items-center justify-center text-brand-400 font-bold text-sm shrink-0">
                  {initials(b)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{b.full_name || b.username}
                    <span className="ml-2 text-xs bg-dark-600 text-gray-400 px-2 py-0.5 rounded-full">{b.role}</span>
                  </div>
                  {b.bio && <div className="text-xs text-gray-400 mt-0.5 truncate">{b.bio}</div>}
                  {b.phone && <div className="text-xs text-gray-500 mt-0.5">{b.phone}</div>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => startEdit(b)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-600 transition-colors">
                    <Pencil size={14}/>
                  </button>
                  <button onClick={() => deleteBarber(b.id, b.full_name || b.username)} className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                    <Trash2 size={14}/>
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Services Tab ──────────────────────────────────────────────────────────────
function ServiceRow({ svc, onSave }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: svc.name, duration_minutes: svc.duration_minutes, price: svc.price, is_active: svc.is_active })
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await api.patch(`/appointments/services/${svc.id}/`, form)
      toast.success('Service updated')
      onSave(); setEditing(false)
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  const del = async () => {
    if (!confirm('Delete "' + svc.name + '"?')) return
    try {
      await api.delete('/appointments/services/' + svc.id + '/')
      toast.success('Service deleted')
      onSave()
    } catch { toast.error('Failed to delete') }
  }

  if (editing) return (
    <div className="bg-dark-700 rounded-xl p-4 border border-brand-500/40 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs text-gray-400 mb-1">Service Name</label>
          <input className="input" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Duration (min)</label>
          <input className="input" type="number" min="5" step="5" value={form.duration_minutes}
            onChange={e => setForm(f => ({...f, duration_minutes: parseInt(e.target.value)}))} />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Price ($)</label>
          <input className="input" type="number" min="0" step="0.5" value={form.price}
            onChange={e => setForm(f => ({...f, price: e.target.value}))} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id={"active-" + svc.id} checked={form.is_active}
          onChange={e => setForm(f => ({...f, is_active: e.target.checked}))} className="accent-brand-500"/>
        <label htmlFor={"active-" + svc.id} className="text-sm text-gray-300">Active (visible to customers)</label>
      </div>
      <div className="flex gap-2">
        <button className="btn-primary flex items-center gap-1.5 text-sm" onClick={save} disabled={saving}>
          <Save size={14}/> {saving ? 'Saving…' : 'Save'}
        </button>
        <button className="btn-secondary text-sm" onClick={() => setEditing(false)}>Cancel</button>
      </div>
    </div>
  )

  return (
    <div className={"flex items-center justify-between p-4 rounded-xl border transition-all " + (svc.is_active ? 'bg-dark-700 border-dark-500' : 'bg-dark-800 border-dark-600 opacity-50')}>
      <div>
        <div className="font-medium flex items-center gap-2 text-sm">
          {svc.name}
          {!svc.is_active && <span className="text-xs bg-dark-600 text-gray-500 px-2 py-0.5 rounded-full">Hidden</span>}
        </div>
        <div className="text-xs text-gray-400 mt-0.5">{svc.duration_minutes} min · <span className="text-brand-400 font-medium">${svc.price}</span></div>
      </div>
      <div className="flex gap-1">
        <button onClick={() => setEditing(true)} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-dark-600 transition-colors">
          <Pencil size={14}/>
        </button>
        <button onClick={del} className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
          <Trash2 size={14}/>
        </button>
      </div>
    </div>
  )
}

function ServicesTab() {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newSvc, setNewSvc] = useState({ name: '', duration_minutes: 30, price: '' })
  const [adding, setAdding] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    api.get('/appointments/services/').then(r => setServices(r.data)).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const addService = async () => {
    if (!newSvc.name || !newSvc.price) { toast.error('Name and price are required'); return }
    setAdding(true)
    try {
      await api.post('/appointments/services/', { ...newSvc, is_active: true })
      toast.success('Service added!')
      setNewSvc({ name: '', duration_minutes: 30, price: '' })
      setShowAdd(false); load()
    } catch (err) {
      toast.error(err.response?.data?.name?.[0] || 'Failed to add service')
    } finally { setAdding(false) }
  }

  if (loading) return <div className="py-12"><LoadingSpinner /></div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-display font-semibold">Services</h2>
          <p className="text-gray-400 text-xs">{services.filter(s => s.is_active).length} active · {services.length} total</p>
        </div>
        <button className="btn-primary flex items-center gap-1.5 text-sm" onClick={() => setShowAdd(v => !v)}>
          <Plus size={14}/> Add Service
        </button>
      </div>
      {showAdd && (
        <div className="bg-dark-700 rounded-xl p-4 border border-brand-500/40 space-y-3">
          <h3 className="font-medium text-sm text-brand-400">New Service</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-gray-400 mb-1">Service Name *</label>
              <input className="input" placeholder="e.g. Fade Cut" value={newSvc.name}
                onChange={e => setNewSvc(f => ({...f, name: e.target.value}))} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Duration (min) *</label>
              <input className="input" type="number" min="5" step="5" value={newSvc.duration_minutes}
                onChange={e => setNewSvc(f => ({...f, duration_minutes: parseInt(e.target.value)}))} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Price ($) *</label>
              <input className="input" type="number" min="0" step="0.5" placeholder="25.00" value={newSvc.price}
                onChange={e => setNewSvc(f => ({...f, price: e.target.value}))} />
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn-primary text-sm flex items-center gap-1.5" onClick={addService} disabled={adding}>
              <Save size={14}/> {adding ? 'Adding…' : 'Add Service'}
            </button>
            <button className="btn-secondary text-sm" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {services.length === 0
          ? <div className="text-center py-10 text-gray-500 text-sm">No services yet.</div>
          : services.map(svc => <ServiceRow key={svc.id} svc={svc} onSave={load} />)}
      </div>
      <div className="bg-dark-700/50 border border-dark-600 rounded-xl p-4 text-sm text-gray-400">
        <div className="flex items-start gap-2">
          <AlertTriangle size={14} className="text-yellow-500 mt-0.5 shrink-0"/>
          <span>To change the number of <strong className="text-gray-300">concurrent chairs</strong>, edit <code className="text-brand-400 bg-dark-600 px-1 rounded text-xs">TOTAL_CHAIRS</code> in <code className="text-brand-400 bg-dark-600 px-1 rounded text-xs">backend/barbershop/settings.py</code> and restart.</span>
        </div>
      </div>
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [tab, setTab] = useState('appointments')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [appointments, setAppointments] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  const loadStats = useCallback(() => {
    api.get('/appointments/bookings/dashboard_stats/').then(r => setStats(r.data))
  }, [])

  const loadAppointments = useCallback(() => {
    setLoading(true)
    api.get('/appointments/bookings/?date=' + format(selectedDate, 'yyyy-MM-dd'))
      .then(r => setAppointments(r.data))
      .finally(() => setLoading(false))
  }, [selectedDate])

  useEffect(() => { loadStats(); loadAppointments() }, [selectedDate])

  const updateStatus = async (id, newStatus) => {
    try {
      await api.patch('/appointments/bookings/' + id + '/update_status/', { status: newStatus })
      toast.success('Status updated')
      loadAppointments(); loadStats()
    } catch { toast.error('Failed to update status') }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-display font-bold">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5">Manage your appointments</p>
        </div>
        <button className="btn-primary flex items-center gap-2 text-sm" onClick={() => setShowModal(true)}>
          <Plus size={16}/> Add Appointment
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            { label: "Today's Bookings", val: stats.today_total,     icon: Calendar,    color: 'text-blue-400'   },
            { label: 'Completed Today',  val: stats.today_completed, icon: CheckCircle, color: 'text-green-400'  },
            { label: 'Still Pending',    val: stats.today_pending,   icon: Clock,       color: 'text-yellow-400' },
            { label: 'This Week',        val: stats.week_total,      icon: BarChart3,   color: 'text-brand-400'  },
          ].map(({ label, val, icon: Icon, color }) => (
            <div key={label} className="card py-4">
              <div className={"mb-1.5 " + color}><Icon size={18}/></div>
              <div className="text-2xl font-bold">{val}</div>
              <div className="text-gray-400 text-xs mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-800 border border-dark-600 rounded-xl p-1 mb-5 w-fit">
        {[['appointments', Calendar, 'Appointments'], ['services', Scissors, 'Services'], ['barbers', Users, 'Barbers']].map(([id, Icon, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={"flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all " + (tab === id ? 'bg-brand-500 text-white' : 'text-gray-400 hover:text-white')}>
            <Icon size={14}/> {label}
          </button>
        ))}
      </div>

      {tab === 'appointments' && (
        <>
          <div className="flex items-center gap-3 mb-4">
            <button className="btn-ghost !px-3 !py-2" onClick={() => setSelectedDate(d => subDays(d, 1))}>
              <ChevronLeft size={16}/>
            </button>
            <div className="flex-1 text-center">
              <h2 className="text-lg font-display font-semibold">{format(selectedDate, 'EEEE, MMMM d')}</h2>
              <input type="date" className="text-xs text-gray-400 bg-transparent border-0 text-center cursor-pointer focus:outline-none"
                value={format(selectedDate, 'yyyy-MM-dd')}
                onChange={e => setSelectedDate(new Date(e.target.value + 'T12:00:00'))} />
            </div>
            <button className="btn-ghost !px-3 !py-2" onClick={() => setSelectedDate(d => addDays(d, 1))}>
              <ChevronRight size={16}/>
            </button>
          </div>
          {loading ? <LoadingSpinner /> : (
            <div className="space-y-3">
              {appointments.length === 0 ? (
                <div className="card text-center py-10 text-gray-400">
                  <Calendar size={36} className="mx-auto mb-3 opacity-30"/>
                  <p className="text-sm">No appointments for this day.</p>
                  <button className="btn-primary mt-3 text-sm" onClick={() => setShowModal(true)}>Add one now</button>
                </div>
              ) : appointments.map(appt => (
                <div key={appt.id} className="card flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="shrink-0 text-center w-20">
                    <div className="text-brand-400 font-semibold text-sm">{formatTime(appt.start_time)}</div>
                    <div className="text-xs text-gray-500">{appt.service_detail?.duration_minutes}min</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-semibold text-sm">{appt.customer_name}</span>
                      <span className={STATUS_COLORS[appt.status]}>{STATUS_LABELS[appt.status]}</span>
                      {appt.added_by_owner && <span className="text-xs bg-dark-600 text-gray-400 px-2 py-0.5 rounded-full">Manual</span>}
                    </div>
                    <div className="text-xs text-gray-400">
                      {appt.customer_phone} · {appt.service_detail?.name} · ${appt.service_detail?.price}
                      {appt.barber_detail && <span className="text-brand-400/80"> · ✂️ {appt.barber_detail.full_name || appt.barber_detail.username}</span>}
                    </div>
                    {appt.notes && <div className="text-xs text-gray-500 mt-0.5">📝 {appt.notes}</div>}
                  </div>
                  <div className="flex gap-1.5 flex-wrap shrink-0">
                    {appt.status === 'confirmed' && (<>
                      <button onClick={() => updateStatus(appt.id, 'in_progress')} className="text-xs btn-ghost !px-2.5 !py-1.5 text-purple-400 border-purple-500/30">▶ Start</button>
                      <button onClick={() => updateStatus(appt.id, 'no_show')} className="text-xs btn-ghost !px-2.5 !py-1.5 text-gray-400">No Show</button>
                    </>)}
                    {appt.status === 'in_progress' && (
                      <button onClick={() => updateStatus(appt.id, 'completed')} className="text-xs bg-green-500/10 border border-green-500/30 text-green-400 px-2.5 py-1.5 rounded-lg">✓ Done</button>
                    )}
                    {!['completed', 'cancelled', 'no_show'].includes(appt.status) && (
                      <button onClick={() => updateStatus(appt.id, 'cancelled')} className="text-xs btn-ghost !px-2.5 !py-1.5 text-red-400 border-red-500/30">Cancel</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'services' && <ServicesTab />}
      {tab === 'barbers' && <BarbersTab />}

      {showModal && <AddBookingModal onClose={() => setShowModal(false)} onSuccess={() => { loadAppointments(); loadStats() }} />}
    </div>
  )
}

function formatTime(t) {
  if (!t) return ''
  const [h, m] = t.split(':')
  const hour = parseInt(h)
  return (hour > 12 ? hour - 12 : hour) + ':' + m + ' ' + (hour >= 12 ? 'PM' : 'AM')
}
