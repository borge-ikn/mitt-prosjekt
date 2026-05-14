import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { User, Users } from 'lucide-react'

const GUIDELINES_URL = 'https://industrikran.sharepoint.com/sites/QHSE/GoverningDocumentLibrary/Forms/Alle%20dokumenter.aspx?id=%2Fsites%2FQHSE%2FGoverningDocumentLibrary%2FADM%2DPROS%2D002%20Retningslinjer%20for%20Pool%2Dbil%20Volvo%20EX30%2Epdf&parent=%2Fsites%2FQHSE%2FGoverningDocumentLibrary'

export default function BookingModal({ initialStart, initialEnd, defaultName = '', onSave, onClose }) {
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [purpose, setPurpose] = useState('')
  const [forOther, setForOther] = useState(false)
  const [otherName, setOtherName] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (initialStart) setStart(format(initialStart, "yyyy-MM-dd'T'HH:mm"))
    if (initialEnd) setEnd(format(initialEnd, "yyyy-MM-dd'T'HH:mm"))
  }, [initialStart, initialEnd])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!start || !end) return setError('Du må velge start- og sluttidspunkt.')
    const s = new Date(start)
    const en = new Date(end)
    if (en <= s) return setError('Sluttidspunkt må være etter starttidspunkt.')
    if (!purpose.trim()) return setError('Formål er påkrevd.')
    if (forOther && !otherName.trim()) return setError('Skriv inn navnet på personen du booker for.')
    if (!agreed) return setError('Du må bekrefte at du har lest retningslinjene.')

    const bookerName = forOther
      ? `${otherName.trim()} (v/ ${defaultName})`
      : defaultName

    setSaving(true)
    try {
      await onSave({
        booker_name: bookerName,
        start_time: s.toISOString(),
        end_time: en.toISOString(),
        purpose: purpose.trim(),
      })
    } catch (err) {
      setError(err.message || 'Noe gikk galt. Prøv igjen.')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-slate-900">Book Poolbil Sandnes</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none cursor-pointer">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Who is booking */}
          <div className="flex gap-2">
            <button type="button" onClick={() => { setForOther(false); setOtherName('') }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                !forOther ? 'bg-slate-900 text-white border-slate-900' : 'text-slate-600 border-slate-200 hover:border-slate-300'
              }`}>
              <User size={14} />
              Meg selv
            </button>
            <button type="button" onClick={() => setForOther(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition-all cursor-pointer ${
                forOther ? 'bg-slate-900 text-white border-slate-900' : 'text-slate-600 border-slate-200 hover:border-slate-300'
              }`}>
              <Users size={14} />
              For noen andre
            </button>
          </div>

          {/* Booker info */}
          <div className="bg-slate-50 rounded-lg px-3 py-2.5 flex items-center gap-2">
            <User size={14} className="text-slate-400 flex-shrink-0" />
            {forOther ? (
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={otherName}
                  onChange={e => setOtherName(e.target.value)}
                  placeholder="Navn på personen du booker for"
                  autoFocus
                  className="w-full bg-transparent text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
                />
                <p className="text-xs text-slate-400 mt-0.5">Registrert av {defaultName}</p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-slate-800">{defaultName}</p>
                <p className="text-xs text-slate-400">Innlogget bruker</p>
              </div>
            )}
          </div>

          {/* Date/time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Fra *</label>
              <input type="datetime-local" value={start} onChange={e => setStart(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Til *</label>
              <input type="datetime-local" value={end} onChange={e => setEnd(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
            </div>
          </div>

          {/* Purpose - required */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Formål *</label>
            <input type="text" value={purpose} onChange={e => setPurpose(e.target.value)}
              placeholder="Kundebesøk, varetransport, kurs, ..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900" />
          </div>

          {/* Guidelines */}
          <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
            agreed ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200 hover:border-slate-300'
          }`}>
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-emerald-600 cursor-pointer flex-shrink-0" />
            <span className="text-xs text-slate-600 leading-snug">
              Jeg bekrefter at jeg har lest og vil følge{' '}
              <a href={GUIDELINES_URL} target="_blank" rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="text-slate-900 underline underline-offset-2 font-medium hover:text-slate-600">
                retningslinjene for Poolbil Volvo EX30
              </a>
            </span>
          </label>

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 border border-slate-200 text-slate-700 rounded-lg py-2 text-sm font-medium hover:bg-slate-50 cursor-pointer">
              Avbryt
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 bg-slate-900 text-white rounded-lg py-2 text-sm font-medium hover:bg-slate-700 disabled:opacity-50 cursor-pointer">
              {saving ? 'Lagrer...' : 'Book bilen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
