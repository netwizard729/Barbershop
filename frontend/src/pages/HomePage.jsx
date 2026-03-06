import { Link } from 'react-router-dom'
import { Scissors, Clock, Users, CheckCircle, ChevronRight, Star } from 'lucide-react'

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'repeating-linear-gradient(45deg, #d4801f 0, #d4801f 1px, transparent 0, transparent 50%)', backgroundSize: '20px 20px'}} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-dark-900" />
        
        <div className="relative max-w-6xl mx-auto px-4 py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/30 rounded-full px-4 py-1.5 mb-6">
              <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
              <span className="text-brand-400 text-sm font-medium">Now accepting online bookings</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-display font-bold leading-tight mb-6">
              No more waiting <br/>
              <span className="text-brand-400">in the queue.</span>
            </h1>
            
            <p className="text-xl text-gray-400 mb-8 leading-relaxed">
              Book your spot online, arrive right on time. We have 3 chairs ready — 
              see real-time availability and lock in your slot in seconds.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Link to="/book" className="btn-primary text-lg !px-8 !py-4 flex items-center gap-2">
                Book Your Cut <ChevronRight size={18}/>
              </Link>
              <Link to="/register" className="btn-ghost text-lg !px-8 !py-4">
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-display font-semibold text-center mb-12">How it works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Clock, title: 'Pick a time', desc: 'See real-time availability across all 3 chairs. No guessing, no waiting.' },
            { icon: CheckCircle, title: 'Book instantly', desc: 'Enter your name and phone number — no account required to book.' },
            { icon: Scissors, title: 'Show up fresh', desc: 'Arrive at your time and walk straight to the chair. Simple.' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="card group hover:border-brand-500/50 transition-colors">
              <div className="w-12 h-12 bg-brand-500/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-500/20 transition-colors">
                <Icon size={22} className="text-brand-400" />
              </div>
              <h3 className="text-xl font-display font-semibold mb-2">{title}</h3>
              <p className="text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats banner */}
      <section className="bg-dark-800 border-y border-dark-600 py-12">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { val: '3', label: 'Chairs available' },
            { val: '30min', label: 'Avg. appointment' },
            { val: '6 days', label: 'A week' },
            { val: '0min', label: 'Wait when booked' },
          ].map(({ val, label }) => (
            <div key={label}>
              <div className="text-3xl font-display font-bold text-brand-400 mb-1">{val}</div>
              <div className="text-gray-400 text-sm">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 py-24 text-center">
        <h2 className="text-4xl font-display font-bold mb-4">Ready for your next cut?</h2>
        <p className="text-gray-400 mb-8">Check available slots right now — no account needed.</p>
        <Link to="/book" className="btn-primary text-lg !px-10 !py-4 inline-flex items-center gap-2">
          <Scissors size={18}/> Book Now
        </Link>
      </section>
    </div>
  )
}
