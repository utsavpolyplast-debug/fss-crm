'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Party, AreaPlan, Profile } from '@/lib/supabase'
import { DELHI_AREAS } from '@/lib/utils'
import { format, addDays, startOfWeek } from 'date-fns'

export default function AdminPlans() {
  const router = useRouter()
  const [fieldBoys, setFieldBoys] = useState<Profile[]>([])
  const [parties, setParties] = useState<Party[]>([])
  const [plans, setPlans] = useState<AreaPlan[]>([])
  const [selUser, setSelUser] = useState('')
  const [selDate, setSelDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [selArea, setSelArea] = useState('East Delhi')
  const [selParties, setSelParties] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [areaFilter, setAreaFilter] = useState('East Delhi')

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }
      const { data: boys } = await supabase.from('profiles').select('*').eq('role', 'field')
      setFieldBoys(boys || [])
      if (boys?.length) setSelUser(boys[0].id)
      const { data: pts } = await supabase.from('parties').select('*').order('area').order('priority')
      setParties(pts || [])
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
      const weekDates = Array.from({ length: 7 }, (_, i) => format(addDays(weekStart, i), 'yyyy-MM-dd'))
      const { data: ps } = await supabase.from('area_plans').select('*, profiles(name)').in('plan_date', weekDates)
      setPlans(ps || [])
      setLoading(false)
    }
    load()
  }, [router])

  const areaParties = parties.filter(p => p.area === areaFilter)

  function toggleParty(id: string) {
    setSelParties(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function selectArea(area: string) {
    setSelArea(area)
    setAreaFilter(area)
    // Auto-select all active parties in that area
    const apts = parties.filter(p => p.area === area && ['Active', 'Follow-up'].includes(p.status))
    setSelParties(apts.map(p => p.id))
  }

  async function savePlan() {
    if (!selUser || !selDate || selParties.length === 0) return
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    // Check if plan already exists
    const existing = plans.find(p => p.user_id === selUser && p.plan_date === selDate)
    if (existing) {
      await supabase.from('area_plans').update({
        area: selArea, party_ids: selParties, notes, created_by: session!.user.id
      }).eq('id', existing.id)
    } else {
      await supabase.from('area_plans').insert({
        user_id: selUser, plan_date: selDate, area: selArea,
        party_ids: selParties, notes, created_by: session!.user.id
      })
    }
    // Refresh plans
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
    const weekDates = Array.from({ length: 7 }, (_, i) => format(addDays(weekStart, i), 'yyyy-MM-dd'))
    const { data: ps } = await supabase.from('area_plans').select('*, profiles(name)').in('plan_date', weekDates)
    setPlans(ps || [])
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 6 }, (_, i) => addDays(weekStart, i))

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Loading...</p></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-brand-500 text-white px-4 pt-10 pb-4">
        <button onClick={() => router.back()} className="text-blue-200 text-sm mb-2 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg> Dashboard
        </button>
        <h1 className="text-xl font-bold">Area Plan Banao</h1>
        <p className="text-blue-200 text-xs">Field boy ko kab kahan jaana hai</p>
      </div>

      {/* This week overview */}
      <div className="px-4 pt-4 pb-2">
        <p className="section-title">Is hafte ka plan</p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs bg-white rounded-xl border border-gray-100 overflow-hidden">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-3 py-2 text-gray-500 font-medium">Din</th>
                <th className="text-left px-3 py-2 text-gray-500 font-medium">Field Boy</th>
                <th className="text-left px-3 py-2 text-gray-500 font-medium">Area</th>
                <th className="text-left px-3 py-2 text-gray-500 font-medium">Parties</th>
              </tr>
            </thead>
            <tbody>
              {weekDays.map((day, i) => {
                const dateStr = format(day, 'yyyy-MM-dd')
                const dayPlans = plans.filter(p => p.plan_date === dateStr)
                return (
                  <tr key={i} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-3 py-2 font-medium text-gray-700">{format(day, 'EEE d')}</td>
                    <td className="px-3 py-2 text-gray-500">
                      {dayPlans.map(p => (p.profiles as any)?.name || '—').join(', ') || '—'}
                    </td>
                    <td className="px-3 py-2 text-gray-500">{dayPlans.map(p => p.area).join(', ') || '—'}</td>
                    <td className="px-3 py-2 text-gray-500">{dayPlans.map(p => p.party_ids.length).reduce((a,b)=>a+b,0) || 0}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/edit plan */}
      <div className="px-4 py-3 space-y-4">
        <p className="section-title">Naya plan assign karo</p>

        <div className="card space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Field Boy</label>
              <select className="input" value={selUser} onChange={e => setSelUser(e.target.value)}>
                {fieldBoys.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Date</label>
              <input className="input" type="date" value={selDate} onChange={e => setSelDate(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="label">Area select karo</label>
            <div className="flex flex-wrap gap-2">
              {DELHI_AREAS.map(area => (
                <button key={area} onClick={() => selectArea(area)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all
                    ${selArea === area ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {area}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Notes (optional)</label>
            <input className="input" value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="e.g. Pehle Laxmi Nagar side jaana" />
          </div>
        </div>

        {/* Party selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="section-title mb-0">{selArea} — parties ({areaParties.length})</p>
            <div className="flex gap-2">
              <button className="text-xs text-brand-500" onClick={() => setSelParties(areaParties.map(p => p.id))}>
                Sab select
              </button>
              <button className="text-xs text-gray-400" onClick={() => setSelParties([])}>
                Clear
              </button>
            </div>
          </div>

          {areaParties.length === 0 && (
            <div className="card text-center py-6 text-gray-400 text-sm">
              {selArea} mein koi party nahi mili.<br/>
              <span className="text-xs">Parties page pe area assign karo</span>
            </div>
          )}

          <div className="space-y-2">
            {areaParties.map(party => (
              <div key={party.id}
                className={`card flex items-center gap-3 cursor-pointer transition-all
                  ${selParties.includes(party.id) ? 'border-brand-500 bg-blue-50' : ''}`}
                onClick={() => toggleParty(party.id)}>
                <div className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2 transition-all
                  ${selParties.includes(party.id) ? 'bg-brand-500 border-brand-500' : 'border-gray-300'}`}>
                  {selParties.includes(party.id) && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/>
                    </svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">{party.name}</p>
                  <p className="text-xs text-gray-400">{party.city} · {party.status}</p>
                </div>
                <span className={`badge text-xs ${party.type === 'Existing Buyer' ? 'bg-green-100 text-green-700' : party.type === 'Ahaar Lead' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                  {party.type === 'Existing Buyer' ? 'Existing' : party.type === 'Ahaar Lead' ? 'Ahaar' : 'New'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {saved && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 text-center font-medium">
            ✅ Plan save ho gaya! Field boy ko dikhai dega
          </div>
        )}

        <button className="btn-primary" onClick={savePlan} disabled={saving || selParties.length === 0}>
          {saving ? 'Saving...' : `✓ Plan save karo (${selParties.length} parties)`}
        </button>
      </div>
    </div>
  )
}
