import { useState } from 'react'
import { Car } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: { scopes: 'openid profile email', redirectTo: window.location.origin },
    })
    if (error) { setError(error.message); setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mb-4">
            <Car size={28} className="text-white" strokeWidth={1.5} />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Poolbil Sandnes</h1>
          <p className="text-sm text-slate-500 mt-1">Volvo EX30 · EN37757</p>
        </div>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-[#0078d4] hover:bg-[#006cbe] text-white font-medium py-2.5 px-4 rounded-xl transition-colors disabled:opacity-60 cursor-pointer text-sm"
        >
          <svg width="18" height="18" viewBox="0 0 21 21" fill="none">
            <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
            <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
            <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
            <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
          </svg>
          {loading ? 'Logger inn...' : 'Logg inn med Microsoft'}
        </button>

        {error && <p className="text-red-500 text-xs text-center mt-3">{error}</p>}
        <p className="text-xs text-slate-400 text-center mt-5">Kun for ansatte i Industrikran Norge AS</p>
      </div>
    </div>
  )
}
