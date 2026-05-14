import { useMemo } from 'react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday,
  format, isBefore, startOfDay, endOfDay
} from 'date-fns'
import { nb } from 'date-fns/locale'

const COLORS = [
  'bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500',
  'bg-pink-500', 'bg-cyan-500', 'bg-orange-500', 'bg-teal-500',
]
function nameToColor(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return COLORS[Math.abs(hash) % COLORS.length]
}

export default function MonthCalendar({ monthStart, bookings, onDayClick, onBookingClick }) {
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(monthStart), { weekStartsOn: 1 })
    const end = endOfWeek(endOfMonth(monthStart), { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [monthStart])

  const weekDays = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn']

  function bookingsForDay(day) {
    const dayStart = startOfDay(day)
    const dayEnd = endOfDay(day)
    return bookings
      .filter(b => new Date(b.start_time) < dayEnd && new Date(b.end_time) > dayStart)
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
  }

  function isFirstDay(b, day) {
    return isSameDay(new Date(b.start_time), day)
  }

  function isLastDay(b, day) {
    return isSameDay(new Date(b.end_time), day) || isBefore(new Date(b.end_time), endOfDay(day))
  }

  const today = startOfDay(new Date())

  return (
    <div className="flex flex-col">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {weekDays.map(d => (
          <div key={d} className="py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wide">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 flex-1">
        {days.map((day, i) => {
          const dayBookings = bookingsForDay(day)
          const isCurrentMonth = isSameMonth(day, monthStart)
          const isPast = isBefore(day, today)
          const isDayToday = isToday(day)

          return (
            <div
              key={day.toISOString()}
              className={`min-h-24 border-b border-r border-gray-100 p-1 cursor-pointer hover:bg-gray-50 transition-colors ${
                !isCurrentMonth ? 'bg-gray-50' : ''
              } ${i % 7 === 0 ? 'border-l' : ''}`}
              onClick={() => {
                if (!isPast) {
                  const start = new Date(day)
                  start.setHours(8, 0, 0, 0)
                  const end = new Date(day)
                  end.setHours(9, 0, 0, 0)
                  onDayClick(start, end)
                }
              }}
            >
              {/* Day number */}
              <div className="flex justify-end mb-1">
                <span className={`text-sm w-7 h-7 flex items-center justify-center rounded-full font-medium ${
                  isDayToday
                    ? 'bg-blue-600 text-white'
                    : isCurrentMonth
                      ? isPast ? 'text-gray-400' : 'text-gray-800'
                      : 'text-gray-300'
                }`}>
                  {format(day, 'd')}
                </span>
              </div>

              {/* Bookings */}
              <div className="flex flex-col gap-0.5">
                {dayBookings.slice(0, 3).map(b => {
                  const first = isFirstDay(b, day)
                  const last = isLastDay(b, day)
                  const color = nameToColor(b.booker_name)
                  return (
                    <div
                      key={b.id}
                      onClick={e => { e.stopPropagation(); onBookingClick(b) }}
                      className={`${color} text-white text-xs px-1 py-0.5 truncate cursor-pointer hover:opacity-80
                        ${first && last ? 'rounded' : first ? 'rounded-l ml-0 -mr-1' : last ? 'rounded-r -ml-1 mr-0' : '-mx-1'}`}
                      title={`${b.booker_name} ${format(new Date(b.start_time), 'd. MMM HH:mm')}–${format(new Date(b.end_time), 'd. MMM HH:mm')}`}
                    >
                      {first && (
                        <>
                          <span className="font-medium">{format(new Date(b.start_time), 'HH:mm')} </span>
                          {b.booker_name}
                        </>
                      )}
                      {!first && <span>&nbsp;</span>}
                    </div>
                  )
                })}
                {dayBookings.length > 3 && (
                  <div className="text-xs text-gray-400 px-1">+{dayBookings.length - 3} til</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
