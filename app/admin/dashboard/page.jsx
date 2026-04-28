'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, badgeColor } from '@/lib/supabase'
import { formatDistance } from '@/lib/utils'
import { format } from 'date-fns'

export default function AdminDashboard() {
  const router = useRouter()
  const [visits, setVisits] = useState([])
  const [stats, setStats] = useState({ total: 0, verified: 0, mismatch: 0, orders: 0, orderAmount: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }
      const today = format(new Date(), 'yyyy-MM-dd')
      const { data: vs } = await supabase.from('visits').select('*, parties(name,city,area), profiles(name)').eq('visit_date', today).order('checkin_time', { ascending: false })
      setVisits(vs || [])
      const { data: ords } = await supabase.from('orders').select('total_amount').eq('order_date', today)
      const orderTotal = (ords || []).reduce((s, o) => s + (o.total_amount || 0), 0)
      setStats({
        total: (vs || []).length,
        verified: (vs || []).filter(v => v.gps_verified).length,
        mismatch: (vs || []).filter(v => !v.gps_verified).length,
        orders: (vs || []).filter(v => v.outcome === 'Order Placed').length,
        orderAmount: orderTotal
      })
      setLoading(false)
    }
    load()
    const interval = setInterval(load, 120000)
    return () => clearInterval(interval)
  }, [router])

  async function logout() { await supabase.auth.signOut(); router.replace('/login') }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Loading...</p></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-brand-500 text-white px-4 pt-10 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-200 text-xs">{format(new Date(), 'EEEE, d MMM yyyy')}</p>
            <h1 className="text-xl font-bold">FSS Admin</h1>
          </div>
          <button onClick={logout} className="text-blue-200 text-xs border border-blue-300 px-2 py-1 rounded-lg">Logout</button>
        </div>
      </div>

      <div className="bg-white border-b px-4 overflow-x-auto">
        <div className="flex gap-1 min-w-max py-1">
          {[['Dashboard','/admin/dashboard'],['Parties','/admin/parties'],['Area Plans','/admin/plans'],['All Visits','/admin/visits'],['Orders','/admin/orders']].map(([label, href]) => (
            <button key={href} onClick={() => router.push(href)} className={'px-3 py-2 text-sm rounded-lg whitespace-nowrap ' + (href === '/admin/dashboard' ? 'bg-blue-50 text-brand-500 font-medium' : 'text-gray-500')}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="card"><p className="text-xs text-gray-400 mb-1">Aaj ki visits</p><p className="text-3xl font-bold text-gray-900">{stats.total}</p></div>
          <div className="card"><p className="text-xs text-gray-400 mb-1">GPS verified</p><p className="text-3xl font-bold text-green-600">{stats.verified}</p></div>
          <div className="card"><p className="text-xs text-gray-400 mb-1">GPS mismatch</p><p className="text-3xl font-bold text-red-600">{stats.mismatch}</p></div>
          <div className="card"><p className="text-xs text-gray-400 mb-1">Aaj ke orders</p><p className="text-3xl font-bold text-amber-600">{stats.orders}</p><p className="text-xs text-gray-400">Rs {stats.orderAmount.toLocaleString('en-IN')}</p></div>
        </div>

        {visits.filter(v => !v.gps_verified).length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="text-sm font-semibold text-red-700 mb-2">GPS Mismatch — check karo</p>
            {visits.filter(v => !v.gps_verified).map(v => (
              <div key={v.id} className="text-sm text-red-600 py-1 border-b border-red-100 last:border-0">
                <span className="font-medium">{v.profiles && v.profiles.name}</span> → {v.parties && v.parties.name}
                {v.gps_distance_meters > 0 && <span className="text-xs ml-2 text-red-400">({formatDistance(v.gps_distance_meters)} door)</span>}
              </div>
            ))}
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="section-title mb-0">Live visit log — aaj</p>
            <button onClick={() => router.push('/admin/visits')} className="text-xs text-brand-500">Sab dekho</button>
          </div>
          <div className="space-y-2">
            {visits.length === 0 && <div className="card text-center py-6 text-gray-400 text-sm">Abhi tak koi visit nahi</div>}
            {visits.map(v => (
              <div key={v.id} className="card">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-gray-900">{v.parties && v.parties.name}</p>
                      <span className={'badge ' + badgeColor(v.outcome)}>{v.outcome}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <p className="text-xs text-gray-400">{v.profiles && v.profiles.name} · {format(new Date(v.checkin_time), 'hh:mm a')}</p>
                      <span className={'text-xs font-medium px-1.5 py-0.5 rounded ' + (v.gps_verified ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                        {v.gps_verified ? 'GPS ok' : 'GPS far'}
                      </span>
                      {v.photo_url && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Photo</span>}
                    </div>
                    {v.items_discussed && <p className="text-xs text-gray-400 mt-1">{v.items_discussed}</p>}
                  </div>
                  {v.photo_url && <img src={v.photo_url} className="w-14 h-14 rounded-lg object-cover flex-shrink-0 cursor-pointer" onClick={() => window.open(v.photo_url, '_blank')} alt="proof" />}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[['Parties manage karo','🏪','/admin/parties'],['Area plan banao','📅','/admin/plans'],['Sab visits dekho','👁️','/admin/visits'],['Orders & sales','📦','/admin/orders']].map(([label,icon,href]) => (
            <button key={href} onClick={() => router.push(href)} className="card flex items-center gap-3 active:scale-95 transition-all text-left">
              <span className="text-2xl">{icon}</span>
              <p className="text-sm font-medium text-gray-700">{label}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
