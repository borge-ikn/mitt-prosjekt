import { useState } from 'react'
import { format, isSameDay } from 'date-fns'
import { nb } from 'date-fns/locale'
import { supabase } from '../lib/supabase'

function formatRange(start, end) {
  const s = new Date(start)
  const e = new Date(end)
  if (isSameDay(s, e)) {
    return `${format(s, 'EEE d. MMM', { locale: nb })}, ${format(s, 'HH:mm')} – ${format(e, 'HH:mm')}`
  }
  return `${format(s, 'EEE d. MMM HH:mm', { locale: nb })} – ${format(e, 'EEE d. MMM HH:mm', { locale: nb })}`
}

export default function DeleteModal({ booking, isOwner, onDelete, onSaved, onClose }) {
  const [mode, setMode] = useState('view') // 'view' | 'edit' | 'confirm'
  const [start, setStart] = useState(format(new Date(booking.start_time), "yyyy-MM-dd'T'HH:mm"))
  const [end, setEnd] = useState(format(new Date(booking.end_time), "yyyy-MM-dd'T'HH:mm"))
  const [purpose, setPurpose] = useState(booking.purpose || '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    setError('')
    const s = new Date(start)
    const e = new Date(end)
    if (e <= s) return setError('Sluttidspunkt må være etter starttidspunkt.')
    setSaving(true)
    const { error } = await supabase
      .from('bil_booking')
      .update({ start_time: s.toISOString(), end_time: e.toISOString(), purpose: purpose.trim() || null })
      .eq('id', booking.id)
    if (error) {
      if (error.message?.includes('overlap') || error.code === '23P01') {
        setError('Bilen er allerede booket i dette tidsrommet.')
      } else {
        setError(error.message)
      }
      setSaving(false)
    } else {
      onSaved()
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await onDelete(booking.id)
    } catch (err) {
      setError(err.message || 'Kunne ikke slette.')
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            {mode === 'edit' ? 'Endre booking' : 'Booking'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none cursor-pointer">&times;</button>
        </div>

        {mode === 'view' ? (
          <>
            {/* Booking info */}
            <div className="bg-blue-50 rounded-lg p-3 mb-4 text-sm text-gray-700">
              <p className="font-semibold text-gray-800">{booking.booker_name}</p>
              <p className="mt-0.5">{formatRange(booking.start_time, booking.end_time)}</p>
              {booking.purpose && <p className="text-gray-500 mt-1">{booking.purpose}</p>}
            </div>

            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

            {isOwner ? (
              <>
                <div className="flex gap-2">
                  <button onClick={onClose} className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 cursor-pointer">
                    Avbryt
                  </button>
                  <button onClick={() => setMode('edit')} className="flex-1 border border-blue-300 text-blue-600 rounded-lg py-2 text-sm font-medium hover:bg-blue-50 cursor-pointer">
                    ✏️ Endre
                  </button>
                  <button onClick={() => setMode('confirm')} className="flex-1 bg-red-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-red-600 cursor-pointer">
                    Avbestill
                  </button>
                </div>
              </>
            ) : (
              <button onClick={onClose} className="w-full border border-gray-300 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 cursor-pointer">
                Lukk
              </button>
            )}
          </>
        ) : mode === 'confirm' ? (
          <>
            <p className="text-sm text-gray-600 mb-4">Er du sikker på at du vil avbestille denne bookingen?</p>
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <div className="flex gap-2">
              <button onClick={() => setMode('view')} className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 cursor-pointer">
                Avbryt
              </button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 bg-red-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-red-600 disabled:opacity-50 cursor-pointer">
                {deleting ? '...' : 'Ja, avbestill'}
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Edit form */}
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Fra</label>
                  <input
                    type="datetime-local"
                    value={start}
                    onChange={e => setStart(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Til</label>
                  <input
                    type="datetime-local"
                    value={end}
                    onChange={e => setEnd(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Formål (valgfritt)</label>
                <input
                  type="text"
                  value={purpose}
                  onChange={e => setPurpose(e.target.value)}
                  placeholder="Kundebesøk, transport, ..."
                  className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <div className="flex gap-2 pt-1">
                <button onClick={() => { setMode('view'); setError('') }} className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 cursor-pointer">
                  Tilbake
                </button>
                <button onClick={handleSave} disabled={saving} className="flex-1 bg-blue-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
                  {saving ? 'Lagrer...' : 'Lagre endring'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
