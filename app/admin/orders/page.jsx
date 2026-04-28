'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, badgeColor } from '@/lib/supabase'
import { format, startOfMonth } from 'date-fns'

export default function AdminOrders() {
  const router = useRouter()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [fromDate, setFromDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [payFilter, setPayFilter] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }
      let q = supabase.from('orders').select('*, parties(name,city,area)').gte('order_date', fromDate).order('order_date', { ascending: false })
      if (payFilter) q = q.eq('payment_status', payFilter)
      const { data } = await q
      setOrders(data || [])
      setLoading(false)
    }
    load()
  }, [router, fromDate, payFilter])

  const total = orders.reduce((s, o) => s + (o.total_amount || 0), 0)
  const pending = orders.filter(o => o.payment_status === 'Pending').reduce((s, o) => s + (o.total_amount || 0), 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-brand-500 text-white px-4 pt-10 pb-4">
        <button onClick={() => router.back()} className="text-blue-200 text-sm mb-2 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg> Dashboard
        </button>
        <h1 className="text-xl font-bold">Orders & Sales</h1>
      </div>

      <div className="px-4 py-3 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="card text-center"><p className="text-xs text-gray-400 mb-1">Total Sales</p><p className="text-xl font-bold text-gray-900">Rs {total.toLocaleString('en-IN')}</p></div>
          <div className="card text-center"><p className="text-xs text-gray-400 mb-1">Pending Payment</p><p className="text-xl font-bold text-red-600">Rs {pending.toLocaleString('en-IN')}</p></div>
        </div>

        <div className="card space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">From date</label><input className="input" type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} /></div>
            <div><label className="label">Payment</label>
              <select className="input" value={payFilter} onChange={e => setPayFilter(e.target.value)}>
                <option value="">All</option><option>Pending</option><option>Partial</option><option>Received</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? <div className="text-center py-8 text-gray-400">Loading...</div> : (
          <div className="space-y-2">
            {orders.map(o => (
              <div key={o.id} className="card">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{o.parties && o.parties.name}</p>
                    <p className="text-xs text-gray-400">{o.order_date} · {o.parties && o.parties.area}</p>
                    <p className="text-xs text-gray-600 mt-1">{o.item} · {o.qty_cartons} cartons x Rs {o.rate_per_carton}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">Rs {(o.total_amount || 0).toLocaleString('en-IN')}</p>
                    <span className={'badge ' + badgeColor(o.payment_status)}>{o.payment_status}</span>
                  </div>
                </div>
              </div>
            ))}
            {orders.length === 0 && <div className="card text-center py-8 text-gray-400 text-sm">Koi order nahi mila</div>}
          </div>
        )}
      </div>
    </div>
  )
}
