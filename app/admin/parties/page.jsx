'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, badgeColor } from '@/lib/supabase'
import { DELHI_AREAS } from '@/lib/utils'

const PARTY_TYPES = ['Existing Buyer', 'Ahaar Lead', 'New Lead']
const PARTY_STATUSES = ['Active', 'Follow-up', 'Cold', 'Converted']

export default function AdminParties() {
  const router = useRouter()
  const [parties, setParties] = useState([])
  const [fieldBoys, setFieldBoys] = useState([])
  const [loading, setLoading] = useState(true)
  const [areaFilter, setAreaFilter] = useState('')
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name:'',contact_person:'',mobile:'',city:'',area:'East Delhi',address:'',lat:'',lng:'',type:'Existing Buyer',status:'Active',products_interested:'',priority:'5',assigned_to:'',notes:'' })

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }
      const { data: pts } = await supabase.from('parties').select('*').order('area').order('priority')
      setParties(pts || [])
      const { data: boys } = await supabase.from('profiles').select('*').eq('role', 'field')
      setFieldBoys(boys || [])
      setLoading(false)
    }
    load()
  }, [router])

  async function saveParty() {
    if (!form.name || !form.city) return
    setSaving(true)
    await supabase.from('parties').insert({ ...form, lat: form.lat ? parseFloat(form.lat) : null, lng: form.lng ? parseFloat(form.lng) : null, priority: parseInt(form.priority), assigned_to: form.assigned_to || null })
    const { data: pts } = await supabase.from('parties').select('*').order('area').order('priority')
    setParties(pts || [])
    setShowAdd(false)
    setForm({ name:'',contact_person:'',mobile:'',city:'',area:'East Delhi',address:'',lat:'',lng:'',type:'Existing Buyer',status:'Active',products_interested:'',priority:'5',assigned_to:'',notes:'' })
    setSaving(false)
  }

  const filtered = parties.filter(p => (!areaFilter || p.area === areaFilter) && (!search || p.name.toLowerCase().includes(search.toLowerCase()) || p.city.toLowerCase().includes(search.toLowerCase())))

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Loading...</p></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-brand-500 text-white px-4 pt-10 pb-4">
        <button onClick={() => router.back()} className="text-blue-200 text-sm mb-2 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg> Dashboard
        </button>
        <div className="flex items-center justify-between">
          <div><h1 className="text-xl font-bold">Parties</h1><p className="text-blue-200 text-xs">{parties.length} total</p></div>
          <button onClick={() => setShowAdd(true)} className="bg-white text-brand-500 text-sm font-medium px-3 py-1.5 rounded-xl">+ Add Party</button>
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        <input className="input" placeholder="Search party name, city..." value={search} onChange={e => setSearch(e.target.value)} />
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button onClick={() => setAreaFilter('')} className={'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ' + (!areaFilter ? 'bg-brand-500 text-white' : 'bg-white border border-gray-200 text-gray-600')}>All Areas</button>
          {DELHI_AREAS.map(a => (
            <button key={a} onClick={() => setAreaFilter(a === areaFilter ? '' : a)} className={'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ' + (areaFilter === a ? 'bg-brand-500 text-white' : 'bg-white border border-gray-200 text-gray-600')}>{a}</button>
          ))}
        </div>
        <p className="text-xs text-gray-400">{filtered.length} parties</p>

        <div className="space-y-2">
          {filtered.map(p => (
            <div key={p.id} className="card">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-sm font-bold text-brand-500 flex-shrink-0">{p.name.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-gray-900">{p.name}</p>
                    <span className={'badge ' + badgeColor(p.status)}>{p.status}</span>
                  </div>
                  <p className="text-xs text-gray-400">{p.city} · {p.area}</p>
                  {p.contact_person && <p className="text-xs text-gray-400">{p.contact_person} · {p.mobile}</p>}
                  {p.products_interested && <p className="text-xs text-gray-400 truncate">{p.products_interested}</p>}
                  <span className={'badge ' + badgeColor(p.type)}>{p.type}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showAdd && (
          <div className="card space-y-3">
            <div className="flex items-center justify-between">
              <p className="section-title mb-0">Naya party add karo</p>
              <button onClick={() => setShowAdd(false)} className="text-gray-400 text-xl">x</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Party Name</label><input className="input" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="Sharma Traders"/></div>
              <div><label className="label">City</label><input className="input" value={form.city} onChange={e => setForm(f=>({...f,city:e.target.value}))} placeholder="Delhi"/></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Contact Person</label><input className="input" value={form.contact_person} onChange={e => setForm(f=>({...f,contact_person:e.target.value}))} /></div>
              <div><label className="label">Mobile</label><input className="input" value={form.mobile} onChange={e => setForm(f=>({...f,mobile:e.target.value}))} /></div>
            </div>
            <div><label className="label">Area</label><select className="input" value={form.area} onChange={e => setForm(f=>({...f,area:e.target.value}))}>{DELHI_AREAS.map(a => <option key={a}>{a}</option>)}</select></div>
            <div><label className="label">Address (GPS ke liye)</label><input className="input" value={form.address} onChange={e => setForm(f=>({...f,address:e.target.value}))} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Latitude</label><input className="input" type="number" step="0.0001" value={form.lat} onChange={e => setForm(f=>({...f,lat:e.target.value}))} placeholder="28.6562"/></div>
              <div><label className="label">Longitude</label><input className="input" type="number" step="0.0001" value={form.lng} onChange={e => setForm(f=>({...f,lng:e.target.value}))} placeholder="77.2410"/></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Type</label><select className="input" value={form.type} onChange={e => setForm(f=>({...f,type:e.target.value}))}>{PARTY_TYPES.map(t => <option key={t}>{t}</option>)}</select></div>
              <div><label className="label">Status</label><select className="input" value={form.status} onChange={e => setForm(f=>({...f,status:e.target.value}))}>{PARTY_STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
            </div>
            <div><label className="label">Products Interested</label><input className="input" value={form.products_interested} onChange={e => setForm(f=>({...f,products_interested:e.target.value}))} placeholder="Oval 500ml, Sipper XL"/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Assign to</label><select className="input" value={form.assigned_to} onChange={e => setForm(f=>({...f,assigned_to:e.target.value}))}><option value="">Any</option>{fieldBoys.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
              <div><label className="label">Priority (1=high)</label><input className="input" type="number" min="1" max="10" value={form.priority} onChange={e => setForm(f=>({...f,priority:e.target.value}))}/></div>
            </div>
            <div className="flex gap-2">
              <button className="btn-primary" onClick={saveParty} disabled={saving}>{saving ? 'Saving...' : 'Party Save karo'}</button>
              <button className="btn-secondary" onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
