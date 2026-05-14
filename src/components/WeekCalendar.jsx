import { useMemo } from 'react'
import {
  startOfWeek, endOfWeek, eachDayOfInterval, isSameDay,
  isToday, format, setHours, setMinutes, startOfDay, endOfDay
} from 'date-fns'
import { nb } from 'date-fns/locale'

const HOUR_START = 6
const HOUR_END = 21
const TOTAL_MINS = (HOUR_END - HOUR_START) * 60
const SLOT_HEIGHT = 80 // px per hour

const COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500',
  'bg-pink-500', 'bg-cyan-500', 'bg-orange-500', 'bg-teal-500',
]

function nameToColor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}

// Returns top/height for a booking segment on a specific day
function segmentStyle(booking, day) {
  const dayStartDt = startOfDay(day)
  const dayEndDt = endOfDay(day)

  const bookingStart = new Date(booking.start_time)
  const bookingEnd = new Date(booking.end_time)

  // Clip to this day's visible window
  const visibleStart = new Date(Math.max(bookingStart, new Date(day.getFullYear(), day.getMonth(), day.getDate(), HOUR_START)))
  const visibleEnd = new Date(Math.min(bookingEnd, new Date(day.getFullYear(), day.getMonth(), day.getDate(), HOUR_END)))

  if (visibleEnd <= visibleStart) return null

  const startMins = (visibleStart.getHours() - HOUR_START) * 60 + visibleStart.getMinutes()
  const durationMins = (visibleEnd - visibleStart) / 60000

  return {
    top: `${(startMins / 60) * SLOT_HEIGHT}px`,
    height: `${Math.max((durationMins / 60) * SLOT_HEIGHT, 20)}px`,
  }
}

function bookingsForDay(bookings, day) {
  const dayStart = startOfDay(day)
  const dayEnd = endOfDay(day)
  return bookings.filter(b =>
    new Date(b.start_time) < dayEnd && new Date(b.end_time) > dayStart
  )
}

export default function WeekCalendar({ weekStart, bookings, onSlotClick, onBookingClick }) {
  const days = useMemo(() => eachDayOfInterval({
    start: startOfWeek(weekStart, { weekStartsOn: 1 }),
    end: endOfWeek(weekStart, { weekStartsOn: 1 }),
  }), [weekStart])

  const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i)

  function handleGridClick(e, day) {
    const rect = e.currentTarget.getBoundingClientRect()
    const y = e.clientY - rect.top
    const clickedHour = HOUR_START + y / SLOT_HEIGHT
    const hour = Math.floor(clickedHour)
    const minute = Math.round(((clickedHour - hour) * 60) / 30) * 30
    const start = setMinutes(setHours(new Date(day), hour), minute)
    const end = setMinutes(setHours(new Date(day), hour + 1), minute)
    onSlotClick(start, end)
  }

  return (
    <div className="flex flex-col min-w-0">
      {/* Day headers */}
      <div className="flex ml-14 border-b border-gray-200">
        {days.map(day => (
          <div key={day.toISOString()} className="flex-1 text-center py-2 min-w-0">
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              {format(day, 'EEE', { locale: nb })}
            </p>
            <p className={`text-lg font-semibold w-8 h-8 flex items-center justify-center mx-auto rounded-full ${
              isToday(day) ? 'bg-blue-600 text-white' : 'text-gray-800'
            }`}>
              {format(day, 'd')}
            </p>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="flex overflow-y-auto" style={{ maxHeight: '600px' }}>
        {/* Hour labels */}
        <div className="w-14 flex-shrink-0">
          {hours.map(h => (
            <div key={h} className="flex items-start justify-end pr-2 text-xs text-gray-400" style={{ height: `${SLOT_HEIGHT}px` }}>
              <span className="-mt-2">{String(h).padStart(2, '0')}:00</span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        {days.map(day => {
          const dayBookings = bookingsForDay(bookings, day)
          return (
            <div
              key={day.toISOString()}
              className="flex-1 relative border-l border-gray-100 cursor-pointer"
              style={{ height: `${(HOUR_END - HOUR_START) * SLOT_HEIGHT}px` }}
              onClick={e => handleGridClick(e, day)}
            >
              {/* Hour lines */}
              {hours.map(h => (
                <div key={h} className="absolute w-full border-t border-gray-100"
                  style={{ top: `${(h - HOUR_START) * SLOT_HEIGHT}px` }} />
              ))}
              {/* Half-hour lines */}
              {hours.map(h => (
                <div key={`${h}-half`} className="absolute w-full border-t border-gray-50"
                  style={{ top: `${(h - HOUR_START) * SLOT_HEIGHT + SLOT_HEIGHT / 2}px` }} />
              ))}

              {/* Bookings */}
              {dayBookings.map(booking => {
                const style = segmentStyle(booking, day)
                if (!style) return null
                const color = nameToColor(booking.booker_name)
                const isStart = isSameDay(new Date(booking.start_time), day)
                const isEnd = isSameDay(new Date(booking.end_time), day)
                const heightPx = parseInt(style.height)

                return (
                  <div
                    key={booking.id}
                    className={`absolute left-0.5 right-0.5 ${color} text-white text-xs px-1 py-0.5 overflow-hidden cursor-pointer hover:opacity-90 z-10
                      ${isStart && isEnd ? 'rounded' : isStart ? 'rounded-t' : isEnd ? 'rounded-b' : ''}`}
                    style={style}
                    onClick={e => { e.stopPropagation(); onBookingClick(booking) }}
                    title={`${booking.booker_name}${booking.purpose ? ` – ${booking.purpose}` : ''}\n${format(new Date(booking.start_time), 'd. MMM HH:mm')} – ${format(new Date(booking.end_time), 'd. MMM HH:mm')}`}
                  >
                    {isStart && (
                      <>
                        <p className="font-semibold truncate">{booking.booker_name}</p>
                        {heightPx > 30 && (
                          <p className="truncate opacity-90">
                            {format(new Date(booking.start_time), 'HH:mm')}–{isEnd ? format(new Date(booking.end_time), 'HH:mm') : '→'}
                          </p>
                        )}
                        {booking.purpose && heightPx > 50 && (
                          <p className="truncate opacity-80">{booking.purpose}</p>
                        )}
                      </>
                    )}
                    {!isStart && (
                      <p className="font-semibold truncate opacity-80">{booking.booker_name}</p>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
