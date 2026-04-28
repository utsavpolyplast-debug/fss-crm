'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, badgeColor } from '@/lib/supabase'
import { format } from 'date-fns'

export default function FieldHome() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [todayPlan, setTodayPlan] = useState(null)
  const [parties, setParties] = useState([])
  const [visitedIds, setVisitedIds] = useState(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
      setProfile(prof)
      const today = format(new Date(), 'yyyy-MM-dd')
      const { data: plan } = await supabase.from('area_plans').select('*').eq('user_id', session.user.id).eq('plan_date', today).single()
      if (plan) {
        setTodayPlan(plan)
        const { data: pts } = await supabase.from('parties').select('*').in('id', plan.party_ids).order('priority', { ascending: true })
        setParties(pts || [])
        const { data: visits } = await supabase.from('visits').select('party_id').eq('user_id', session.user.id).eq('visit_date', today)
        setVisitedIds(new Set((visits || []).map(v => v.party_id)))
      } else {
        const { data: pts } = await supabase.from('parties').select('*').eq('assigned_to', session.user.id).in('status', ['Active', 'Follow-up']).order('priority', { ascending: true }).limit(15)
        setParties(pts || [])
      }
      setLoading(false)
    }
    load()
  }, [router])

  async function logout() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-gray-400">Loading...</div></div>

  const done = parties.filter(p => visitedIds.has(p.id))
  const pending = parties.filter(p => !visitedIds.has(p.id))

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-brand-500 text-white px-4 pt-10 pb-6">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-blue-200 text-xs">{format(new Date(), 'EEEE, d MMM yyyy')}</p>
            <h1 className="text-lg font-bold">Namaste, {profile?.name || 'Field Boy'}</h1>
          </div>
          <button onClick={logout} className="text-blue-200 text-xs border border-blue-300 px-2 py-1 rounded-lg">Logout</button>
        </div>
        {todayPlan && (
          <div className="mt-3 bg-blue-600 rounded-xl px-3 py-2 flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-200">Aaj ka area</p>
              <p className="font-semibold">{todayPlan.area}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{done.length}/{parties.length}</p>
              <p className="text-xs text-blue-200">visits done</p>
            </div>
          </div>
        )}
      </div>

      {parties.length > 0 && (
        <div className="px-4 mt-2">
          <div className="bg-blue-100 rounded-full h-1.5">
            <div className="bg-green-400 h-1.5 rounded-full transition-all" style={{ width: parties.length > 0 ? Math.round((done.length / parties.length) * 100) + '%' : '0%' }} />
          </div>
          <p className="text-xs text-gray-400 mt-1">{done.length} done · {pending.length} baki hain</p>
        </div>
      )}

      <div className="px-4 py-4 space-y-4">
        {pending.length > 0 && (
          <div>
            <p className="section-title">Aaj ki visits — pending</p>
            <div className="space-y-2">
              {pending.map((party, i) => (
                <div key={party.id} className="card flex items-center gap-3 cursor-pointer active:scale-95 transition-all" onClick={() => router.push('/field/checkin?party=' + party.id)}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${i === 0 ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-500'}`}>{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{party.name}</p>
                    <p className="text-xs text-gray-400">{party.city} · {party.area}</p>
                    {party.products_interested && <p className="text-xs text-gray-400 truncate">{party.products_interested}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`badge ${badgeColor(party.status)}`}>{party.status}</span>
                    <span className={`badge ${badgeColor(party.type)}`}>{party.type}</span>
                  </div>
                  <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                </div>
              ))}
            </div>
          </div>
        )}

        {done.length > 0 && (
          <div>
            <p className="section-title text-green-700">Completed ({done.length})</p>
            <div className="space-y-2">
              {done.map(party => (
                <div key={party.id} className="card flex items-center gap-3 opacity-70">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-700 truncate">{party.name}</p>
                    <p className="text-xs text-gray-400">{party.city}</p>
                  </div>
                  <span className="text-xs text-green-600 font-medium">Done</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {parties.length === 0 && (
          <div className="card text-center py-8">
            <p className="text-gray-400 text-sm">Aaj ka koi plan nahi mila</p>
            <p className="text-gray-400 text-xs mt-1">Admin se plan assign karaao</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => router.push('/field/schedule')} className="card flex flex-col items-center gap-2 py-4 active:scale-95 transition-all">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </div>
            <p className="text-xs font-medium text-gray-700">Weekly schedule</p>
          </button>
          <button onClick={() => router.push('/admin/dashboard')} className="card flex flex-col items-center gap-2 py-4 active:scale-95 transition-all">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
            </div>
            <p className="text-xs font-medium text-gray-700">Visit history</p>
          </button>
        </div>
      </div>
    </div>
  )
}
