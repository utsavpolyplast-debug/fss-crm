'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Visit } from '@/lib/supabase'
import { badgeColor, formatDistance } from '@/lib/utils'
import { format } from 'date-fns'

export default function AdminVisits() {
  const router = useRouter()
  const [visits, setVisits] = useState<Visit[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [outcomeFilter, setOutcomeFilter] = useState('')
  const [gpsFilter, setGpsFilter] = useState('')
  const [bigPhoto, setBigPhoto] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }
      let q = supabase.from('visits')
        .select('*, parties(name, city, area), profiles(name)')
        .order('checkin_time', { ascending: false })
        .limit(100)
      if (dateFilter) q = q.eq('visit_date', dateFilter)
      if (outcomeFilter) q = q.eq('outcome', outcomeFilter)
      if (gpsFilter === 'verified') q = q.eq('gps_verified', true)
      if (gpsFilter === 'mismatch') q = q.eq('gps_verified', false)
      const { data } = await q
      setVisits(data || [])
      setLoading(false)
    }
    load()
  }, [router, dateFilter, outcomeFilter, gpsFilter])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-brand-500 text-white px-4 pt-10 pb-4">
        <button onClick={() => router.back()} className="text-blue-200 text-sm mb-2 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg> Dashboard
        </button>
        <h1 className="text-xl font-bold">All Visits</h1>
        <p className="text-blue-200 text-xs">{visits.length} records</p>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* Filters */}
        <div className="card space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Date</label>
              <input className="input" type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
            </div>
            <div>
              <label className="label">Outcome</label>
              <select className="input" value={outcomeFilter} onChange={e => setOutcomeFilter(e.target.value)}>
                <option value="">All</option>
                <option>Order Placed</option>
                <option>Follow-up</option>
                <option>Not Interested</option>
                <option>Sample Given</option>
                <option>Meeting Done</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">GPS status</label>
            <div className="flex gap-2">
              {[['', 'All'], ['verified', '✅ Verified only'], ['mismatch', '⚠️ Mismatch only']].map(([val, label]) => (
                <button key={val} onClick={() => setGpsFilter(val)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium ${gpsFilter === val ? 'bg-brand-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading...</div>
        ) : (
          <div className="space-y-2">
            {visits.map(v => (
              <div key={v.id} className={`card ${!v.gps_verified ? 'border-red-200' : ''}`}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-gray-900">{(v.parties as any)?.name}</p>
                      <span className={`badge ${badgeColor(v.outcome)}`}>{v.outcome}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {(v.profiles as any)?.name} · {format(new Date(v.checkin_time), 'hh:mm a')} · {(v.parties as any)?.area}
                    </p>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${v.gps_verified ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {v.gps_verified ? '📍 GPS ok' : `⚠️ GPS far ${v.gps_distance_meters > 0 ? `(${formatDistance(v.gps_distance_meters)})` : ''}`}
                      </span>
                      {v.photo_url
                        ? <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full cursor-pointer" onClick={() => setBigPhoto(v.photo_url!)}>📸 Photo dekho</span>
                        : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">No photo</span>
                      }
                    </div>
                    {v.items_discussed && <p className="text-xs text-gray-400 mt-1">{v.items_discussed}</p>}
                    {v.remarks && <p className="text-xs text-gray-500 mt-0.5 italic">"{v.remarks}"</p>}
                  </div>
                  {v.photo_url && (
                    <img src={v.photo_url} className="w-16 h-16 rounded-xl object-cover flex-shrink-0 cursor-pointer"
                      onClick={() => setBigPhoto(v.photo_url!)} alt="proof" />
                  )}
                </div>
              </div>
            ))}
            {visits.length === 0 && (
              <div className="card text-center py-8 text-gray-400 text-sm">Koi visit nahi mili</div>
            )}
          </div>
        )}
      </div>

      {/* Full photo lightbox */}
      {bigPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setBigPhoto('')}>
          <img src={bigPhoto} className="max-w-full max-h-full rounded-xl" alt="Visit proof"/>
          <button className="absolute top-4 right-4 text-white text-2xl font-bold">×</button>
        </div>
      )}
    </div>
  )
}
