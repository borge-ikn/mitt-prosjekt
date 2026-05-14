import { useState, useEffect } from 'react'
import { format, differenceInDays, parseISO } from 'date-fns'
import { nb } from 'date-fns/locale'
import { CircleCheck, CircleAlert, TriangleAlert } from 'lucide-react'
import { supabase } from '../lib/supabase'

function getDekkEvents(year) {
  return [
    { type: 'sommer', label: 'Sommerdekk', frist: new Date(year, 3, 15), emoji: '☀️' },
    { type: 'vinter', label: 'Vinterdekk', frist: new Date(year, 9, 15), emoji: '❄️' },
  ]
}

export default function DekkSkifteBanner({ userName, userId }) {
  const [kvitteringer, setKvitteringer] = useState([])
  const [kvitterer, setKvitterer] = useState(null)
  const [loading, setLoading] = useState(false)

  const now = new Date()
  const year = now.getFullYear()
  const events = getDekkEvents(year)

  useEffect(() => {
    supabase.from('dekk_skifte').select('*').in('year', [year - 1, year])
      .then(({ data }) => setKvitteringer(data || []))
  }, [year])

  function getKvittering(type) {
    return kvitteringer.find(k => k.type === type && k.year === year)
  }

  async function handleKvitter(type) {
    setLoading(true)
    const { error } = await supabase.from('dekk_skifte')
      .insert([{ type, year, done_by: userName, user_id: userId }])
    if (!error) {
      const { data } = await supabase.from('dekk_skifte').select('*').in('year', [year - 1, year])
      setKvitteringer(data || [])
    }
    setKvitterer(null)
    setLoading(false)
  }

  const relevantEvents = events.filter(ev => {
    const dager = differenceInDays(ev.frist, now)
    return dager <= 45 || !getKvittering(ev.type)
  })

  if (!relevantEvents.length) return null

  return (
    <>
      {relevantEvents.map(ev => {
        const kvittering = getKvittering(ev.type)
        const dager = differenceInDays(ev.frist, now)
        const forfalt = dager < 0 && !kvittering

        const { bg, border, textColor, mutedColor, Icon } = kvittering
          ? { bg: 'bg-emerald-50', border: 'border-emerald-200', textColor: 'text-emerald-800', mutedColor: 'text-emerald-500', Icon: CircleCheck }
          : forfalt
          ? { bg: 'bg-red-50', border: 'border-red-200', textColor: 'text-red-800', mutedColor: 'text-red-400', Icon: TriangleAlert }
          : dager <= 14
          ? { bg: 'bg-amber-50', border: 'border-amber-200', textColor: 'text-amber-800', mutedColor: 'text-amber-500', Icon: CircleAlert }
          : { bg: 'bg-blue-50', border: 'border-blue-200', textColor: 'text-blue-800', mutedColor: 'text-blue-400', Icon: CircleAlert }

        return (
          <div key={ev.type} className={`border rounded-xl px-4 py-3 flex items-center justify-between gap-3 ${bg} ${border} ${textColor}`}>
            <div className="flex items-center gap-2 min-w-0 text-sm">
              <Icon size={15} strokeWidth={2} className="flex-shrink-0" />
              <span className="font-medium">{ev.label}</span>
              <span className="opacity-70">· frist {format(ev.frist, 'd. MMMM', { locale: nb })}</span>
              {kvittering ? (
                <span className={`hidden sm:inline ${mutedColor}`}>
                  · Kvittert av <strong>{kvittering.done_by}</strong> {format(parseISO(kvittering.done_at), 'd. MMM', { locale: nb })}
                </span>
              ) : forfalt ? (
                <span className="font-semibold">· Ikke kvittert!</span>
              ) : dager >= 0 ? (
                <span className={`hidden sm:inline ${mutedColor}`}>· om {dager} dager</span>
              ) : null}
            </div>

            {!kvittering && (
              kvitterer === ev.type ? (
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs opacity-70 hidden sm:block">Dekk skiftet?</span>
                  <button onClick={() => handleKvitter(ev.type)} disabled={loading}
                    className="bg-emerald-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-emerald-700 disabled:opacity-50 cursor-pointer whitespace-nowrap">
                    {loading ? '...' : 'Bekreft'}
                  </button>
                  <button onClick={() => setKvitterer(null)} className="text-xs opacity-50 hover:opacity-100 cursor-pointer">
                    Avbryt
                  </button>
                </div>
              ) : (
                <button onClick={() => setKvitterer(ev.type)}
                  className={`flex-shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg border cursor-pointer whitespace-nowrap transition-colors
                    ${forfalt ? 'bg-red-600 text-white border-red-600 hover:bg-red-700' : 'bg-white/70 border-current hover:bg-white'}`}>
                  Kvitter ut
                </button>
              )
            )}
          </div>
        )
      })}
    </>
  )
}
