import { useState, useEffect, useCallback } from 'react'
import { startOfWeek, addWeeks, subWeeks, addMonths, subMonths, startOfMonth, format } from 'date-fns'
import { nb } from 'date-fns/locale'
import { Car, ChevronLeft, ChevronRight, CalendarDays, Plus, LogOut } from 'lucide-react'
import { supabase } from './lib/supabase'
import WeekCalendar from './components/WeekCalendar'
import MonthCalendar from './components/MonthCalendar'
import BookingModal from './components/BookingModal'
import DeleteModal from './components/DeleteModal'
import LoginPage from './components/LoginPage'
import EuKontrollBanner from './components/EuKontrollBanner'
import DekkSkifteBanner from './components/DekkSkifteBanner'
import './index.css'

export default function App() {
  const [session, setSession] = useState(undefined)
  const [view, setView] = useState('week')
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [monthStart, setMonthStart] = useState(() => startOfMonth(new Date()))
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [bookingModal, setBookingModal] = useState(null)
  const [deleteModal, setDeleteModal] = useState(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [])

  const fetchBookings = useCallback(async () => {
    let from, to
    if (view === 'week') {
      from = new Date(weekStart); from.setDate(from.getDate() - 7)
      to = new Date(from); to.setDate(to.getDate() + 21)
    } else {
      from = new Date(monthStart); from.setDate(from.getDate() - 7)
      to = new Date(monthStart); to.setMonth(to.getMonth() + 2)
    }
    const { data, error } = await supabase
      .from('bil_booking').select('*')
      .gte('start_time', from.toISOString())
      .lte('start_time', to.toISOString())
      .order('start_time')
    if (!error) setBookings(data || [])
    setLoading(false)
  }, [weekStart, monthStart, view])

  useEffect(() => { if (!session) return; setLoading(true); fetchBookings() }, [fetchBookings, session])

  useEffect(() => {
    if (!session) return
    const channel = supabase.channel('bil_booking_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bil_booking' }, fetchBookings)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchBookings, session])

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  async function handleSaveBooking({ booker_name, start_time, end_time, purpose }) {
    const { error } = await supabase.from('bil_booking')
      .insert([{ booker_name, start_time, end_time, purpose, user_id: session.user.id }])
    if (error) {
      if (error.message?.includes('overlap') || error.code === '23P01')
        throw new Error('Bilen er allerede booket i dette tidsrommet.')
      throw new Error(error.message)
    }
    setBookingModal(null); showToast('Booking registrert!'); fetchBookings()
  }

  async function handleDeleteBooking(id) {
    const { error } = await supabase.from('bil_booking').delete().eq('id', id)
    if (error) throw new Error(error.message)
    setDeleteModal(null); showToast('Booking slettet.', 'info'); fetchBookings()
  }

  function goToToday() {
    setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))
    setMonthStart(startOfMonth(new Date()))
  }

  if (session === undefined) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-slate-400 text-sm">Laster...</div>
    </div>
  )
  if (!session) return <LoginPage />

  const userName = session.user?.user_metadata?.full_name
    || session.user?.user_metadata?.name
    || session.user?.email?.split('@')[0] || ''

  const navLabel = view === 'week'
    ? format(weekStart, "'Uke' w  ·  yyyy", { locale: nb })
    : format(monthStart, 'MMMM yyyy', { locale: nb })

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-2 sm:gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2.5 pr-0 sm:pr-4 border-r-0 sm:border-r border-slate-200">
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center flex-shrink-0">
              <Car size={18} className="text-white" strokeWidth={1.75} />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-slate-900 leading-tight">Poolbil Sandnes</p>
              <p className="text-xs text-slate-400 leading-tight">Volvo EX30 · EN37757</p>
            </div>
          </div>

          {/* View toggle */}
          <div className="flex bg-slate-100 rounded-lg p-0.5 gap-0.5">
            {[['week', 'Uke'], ['month', 'Måned']].map(([v, label]) => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  view === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}>
                {label}
              </button>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <button onClick={goToToday}
              className="hidden sm:block px-2.5 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
              I dag
            </button>
            <button onClick={() => view === 'week' ? setWeekStart(w => subWeeks(w, 1)) : setMonthStart(m => subMonths(m, 1))}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm font-medium text-slate-700 w-20 sm:w-40 text-center capitalize tabular-nums">
              {navLabel}
            </span>
            <button onClick={() => view === 'week' ? setWeekStart(w => addWeeks(w, 1)) : setMonthStart(m => addMonths(m, 1))}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Actions */}
          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={() => setBookingModal({ start: roundToNext30(new Date()), end: roundToNext30(new Date(), 60) })}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-700 text-white text-sm font-medium px-2.5 sm:px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer">
              <Plus size={15} strokeWidth={2.5} />
              <span className="hidden sm:inline">Book bilen</span>
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <span className="text-sm text-slate-600 hidden md:block">{userName}</span>
              <button onClick={() => supabase.auth.signOut()}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer" title="Logg ut">
                <LogOut size={15} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4">
        {/* Info banners */}
        <div className="flex flex-col gap-2 mb-4">
          <EuKontrollBanner />
          <DekkSkifteBanner userName={userName} userId={session.user.id} />
        </div>

        {/* Calendar */}
        {loading ? (
          <div className="flex justify-center items-center h-64 text-slate-400 text-sm">Laster bookinger...</div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {view === 'week'
              ? <WeekCalendar weekStart={weekStart} bookings={bookings}
                  onSlotClick={(s, e) => setBookingModal({ start: s, end: e })}
                  onBookingClick={b => setDeleteModal(b)} />
              : <MonthCalendar monthStart={monthStart} bookings={bookings}
                  onDayClick={(s, e) => setBookingModal({ start: s, end: e })}
                  onBookingClick={b => setDeleteModal(b)} />
            }
          </div>
        )}

        {view === 'week' && <UpcomingList bookings={bookings} onBookingClick={b => setDeleteModal(b)} />}
      </main>

      {bookingModal && (
        <BookingModal initialStart={bookingModal.start} initialEnd={bookingModal.end}
          defaultName={userName} onSave={handleSaveBooking} onClose={() => setBookingModal(null)} />
      )}
      {deleteModal && (
        <DeleteModal booking={deleteModal} isOwner={deleteModal.user_id === session.user.id}
          onDelete={handleDeleteBooking}
          onSaved={() => { setDeleteModal(null); showToast('Booking oppdatert!'); fetchBookings() }}
          onClose={() => setDeleteModal(null)} />
      )}

      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-lg shadow-lg text-white text-sm font-medium z-50 ${
          toast.type === 'info' ? 'bg-slate-800' : 'bg-emerald-600'
        }`}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}

function UpcomingList({ bookings, onBookingClick }) {
  const now = new Date()
  const upcoming = bookings
    .filter(b => new Date(b.end_time) >= now)
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
    .slice(0, 6)
  if (!upcoming.length) return null

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-2">
        <CalendarDays size={14} className="text-slate-400" />
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Kommende bookinger</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {upcoming.map(b => (
          <div key={b.id} onClick={() => onBookingClick(b)}
            className="bg-white border border-slate-200 rounded-lg px-4 py-3 flex items-center justify-between cursor-pointer hover:border-slate-300 hover:shadow-sm transition-all">
            <div className="min-w-0">
              <p className="font-medium text-slate-800 text-sm truncate">{b.booker_name}</p>
              {b.purpose && <p className="text-slate-400 text-xs truncate">{b.purpose}</p>}
            </div>
            <div className="text-right text-xs text-slate-500 flex-shrink-0 ml-3">
              <p className="font-medium">{format(new Date(b.start_time), 'EEE d. MMM', { locale: nb })}</p>
              <p>{format(new Date(b.start_time), 'HH:mm')} – {format(new Date(b.end_time), 'HH:mm')}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function roundToNext30(date, offsetMins = 0) {
  const d = new Date(date.getTime() + offsetMins * 60000)
  const mins = d.getMinutes()
  const rounded = mins < 30 ? 30 : 60
  d.setMinutes(rounded === 60 ? 0 : rounded)
  if (rounded === 60) d.setHours(d.getHours() + 1)
  d.setSeconds(0, 0)
  return d
}
