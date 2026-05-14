import { useState, useEffect } from 'react'
import { format, differenceInDays, parseISO } from 'date-fns'
import { nb } from 'date-fns/locale'
import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function EuKontrollBanner() {
  const [data, setData] = useState(null)

  useEffect(() => {
    supabase.from('abax_kjoretoy').select('pkk_kontrollfrist, pkk_sist_godkjent')
      .eq('license_plate', 'EN37757').single()
      .then(({ data }) => { if (data) setData(data) })
  }, [])

  if (!data?.pkk_kontrollfrist) return null

  const now = new Date()
  const frist = parseISO(data.pkk_kontrollfrist)
  const dagerIgjen = differenceInDays(frist, now)
  const fristDato = format(frist, 'd. MMMM yyyy', { locale: nb })

  const periodStart = data.pkk_sist_godkjent
    ? parseISO(data.pkk_sist_godkjent)
    : new Date(frist.getFullYear() - 4, frist.getMonth(), frist.getDate())
  const totalDager = differenceInDays(frist, periodStart)
  const bruktDager = differenceInDays(now, periodStart)
  const prosent = Math.min(100, Math.max(0, Math.round((bruktDager / totalDager) * 100)))

  const forfalt = dagerIgjen < 0
  const urgent = dagerIgjen < 30
  const warning = dagerIgjen < 90

  const Icon = forfalt || urgent ? ShieldX : warning ? ShieldAlert : ShieldCheck
  const barColor = forfalt || urgent ? 'bg-red-500' : warning ? 'bg-amber-400' : 'bg-emerald-500'
  const { bg, border, textColor, mutedColor } = forfalt || urgent
    ? { bg: 'bg-red-50', border: 'border-red-200', textColor: 'text-red-800', mutedColor: 'text-red-400' }
    : warning
    ? { bg: 'bg-amber-50', border: 'border-amber-200', textColor: 'text-amber-800', mutedColor: 'text-amber-400' }
    : { bg: 'bg-emerald-50', border: 'border-emerald-200', textColor: 'text-emerald-800', mutedColor: 'text-emerald-500' }

  return (
    <div className={`border rounded-xl px-4 py-3 ${bg} ${border}`}>
      <div className={`flex items-center justify-between gap-4 mb-2.5 ${textColor}`}>
        <div className="flex items-center gap-2">
          <Icon size={15} strokeWidth={2} />
          <span className="text-sm font-medium">EU-kontroll</span>
          <span className="text-sm opacity-70">· {fristDato}</span>
        </div>
        <span className="text-sm font-semibold tabular-nums flex-shrink-0">
          {forfalt ? 'Forfalt!' : dagerIgjen === 0 ? 'I dag!' : `${dagerIgjen} dager igjen`}
        </span>
      </div>
      <div className="w-full bg-black/8 rounded-full h-1.5 overflow-hidden">
        <div className={`h-1.5 rounded-full ${barColor}`} style={{ width: `${prosent}%` }} />
      </div>
      <div className={`flex justify-between text-xs mt-1.5 ${mutedColor}`}>
        <span>
          {data.pkk_sist_godkjent
            ? `Godkjent ${format(periodStart, 'd. MMM yyyy', { locale: nb })}`
            : 'Forrige kontroll ukjent'}
        </span>
        <span>{prosent}% av perioden brukt</span>
      </div>
    </div>
  )
}
