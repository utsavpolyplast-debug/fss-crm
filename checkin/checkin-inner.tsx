'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase, Party } from '@/lib/supabase'
import { getCurrentLocation, getDistanceMeters, addWatermarkToPhoto, formatDistance, GPS_VERIFY_RADIUS } from '@/lib/utils'
import { format } from 'date-fns'

type Step = 'gps' | 'photo' | 'form' | 'done'

export default function CheckIn() {
  const router = useRouter()
  const params = useSearchParams()
  const partyId = params.get('party')

  const [party, setParty] = useState<Party | null>(null)
  const [step, setStep] = useState<Step>('gps')
  const [gpsLat, setGpsLat] = useState(0)
  const [gpsLng, setGpsLng] = useState(0)
  const [gpsVerified, setGpsVerified] = useState(false)
  const [gpsDistance, setGpsDistance] = useState(0)
  const [gpsError, setGpsError] = useState('')
  const [gpsLoading, setGpsLoading] = useState(false)
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [outcome, setOutcome] = useState('Meeting Done')
  const [items, setItems] = useState('')
  const [qty, setQty] = useState('')
  const [rate, setRate] = useState('')
  const [remarks, setRemarks] = useState('')
  const [followupDate, setFollowupDate] = useState('')
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!partyId) { router.replace('/field/home'); return }
    supabase.from('parties').select('*').eq('id', partyId).single()
      .then(({ data }) => { if (data) setParty(data) })
  }, [partyId, router])

  async function captureGPS() {
    setGpsLoading(true)
    setGpsError('')
    try {
      const coords = await getCurrentLocation()
      setGpsLat(coords.latitude)
      setGpsLng(coords.longitude)
      if (party?.lat && party?.lng) {
        const dist = getDistanceMeters(coords.latitude, coords.longitude, party.lat, party.lng)
        setGpsDistance(dist)
        setGpsVerified(dist <= GPS_VERIFY_RADIUS)
      } else {
        setGpsVerified(true)
      }
      setStep('photo')
    } catch (e: any) {
      setGpsError(e.message)
    }
    setGpsLoading(false)
  }

  async function handlePhotoCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const watermarked = await addWatermarkToPhoto(file, gpsLat, gpsLng, party?.name || '')
    setPhotoBlob(watermarked)
    setPhotoPreview(URL.createObjectURL(watermarked))
    setStep('form')
  }

  async function submitVisit() {
    if (!party) return
    setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { router.replace('/login'); return }

    let photo_url = null
    if (photoBlob) {
      const filename = `visits/${session.user.id}/${Date.now()}.jpg`
      const { data: uploadData } = await supabase.storage
        .from('visit-photos')
        .upload(filename, photoBlob, { contentType: 'image/jpeg' })
      if (uploadData) {
        const { data: urlData } = supabase.storage.from('visit-photos').getPublicUrl(filename)
        photo_url = urlData.publicUrl
      }
    }

    const visitData = {
      party_id: party.id,
      user_id: session.user.id,
      visit_date: format(new Date(), 'yyyy-MM-dd'),
      checkin_time: new Date().toISOString(),
      gps_lat: gpsLat,
      gps_lng: gpsLng,
      gps_verified: gpsVerified,
      gps_distance_meters: Math.round(gpsDistance),
      photo_url,
      outcome,
      items_discussed: items,
      remarks,
      next_followup_date: followupDate || null
    }

    const { data: visit } = await supabase.from('visits').insert(visitData).select().single()

    if (outcome === 'Order Placed' && items && qty) {
      await supabase.from('orders').insert({
        party_id: party.id,
        visit_id: visit?.id,
        user_id: session.user.id,
        order_date: format(new Date(), 'yyyy-MM-dd'),
        item: items,
        qty_cartons: parseInt(qty) || 0,
        rate_per_carton: parseFloat(rate) || 0,
        total_amount: (parseInt(qty) || 0) * (parseFloat(rate) || 0),
        payment_status: 'Pending',
        remarks
      })
    }

    if (outcome === 'Order Placed') {
      await supabase.from('parties').update({ status: 'Active' }).eq('id', party.id)
    } else if (outcome === 'Follow-up') {
      await supabase.from('parties').update({ status: 'Follow-up' }).eq('id', party.id)
    }

    setStep('done')
    setSaving(false)
  }

  if (!party) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Loading party details...</p></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()} className="w-8 h-8 flex items-center justify-center">
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <div>
          <p className="font-semibold text-sm text-gray-900">{party.name}</p>
          <p className="text-xs text-gray-400">{party.area} · {party.city}</p>
        </div>
      </div>

      <div className="px-4 py-3">
        <div className="flex items-center gap-2">
          {(['gps','photo','form'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
                ${step === s ? 'bg-brand-500 text-white' :
                  ['gps','photo','form','done'].indexOf(step) > i ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {['gps','photo','form','done'].indexOf(step) > i ? '✓' : i+1}
              </div>
              <span className="text-xs text-gray-500 hidden sm:block">{['GPS','Photo','Details'][i]}</span>
              {i < 2 && <div className="flex-1 h-px bg-gray-200 w-8"/>}
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 pb-8 space-y-4">
        {step === 'gps' && (
          <div className="card space-y-4">
            <div>
              <p className="section-title">Step 1: Location verify karo</p>
              <p className="text-sm text-gray-500">Pehle GPS se confirm karo ki aap sahi jagah par ho</p>
            </div>
            {party.address && (
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400 mb-1">Party ka address</p>
                <p className="text-sm text-gray-700">{party.address}</p>
              </div>
            )}
            {gpsError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-3 py-2">{gpsError}</div>
            )}
            <button className="btn-primary" onClick={captureGPS} disabled={gpsLoading}>
              {gpsLoading ? <><span className="animate-spin">⟳</span> GPS dhundh raha hai...</> : <><span>📍</span> Meri location capture karo</>}
            </button>
          </div>
        )}

        {step === 'photo' && (
          <div className="card space-y-4">
            <div>
              <p className="section-title">Step 2: Photo lo</p>
              <div className={`rounded-xl p-3 mb-3 ${gpsVerified ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <div className="flex items-center gap-2">
                  <span>{gpsVerified ? '✅' : '⚠️'}</span>
                  <div>
                    <p className={`text-sm font-medium ${gpsVerified ? 'text-green-700' : 'text-red-700'}`}>
                      {gpsVerified ? 'Location verified!' : 'Location match nahi hua'}
                    </p>
                    {gpsDistance > 0 && <p className="text-xs text-gray-500">Party se {formatDistance(gpsDistance)} door ho</p>}
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-500">Shop ke bahar ki photo + selfie lo</p>
              <p className="text-xs text-gray-400 mt-1">Photo mein date, time aur GPS automatically add ho jaayega</p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoCapture} />
            <button className="btn-primary" onClick={() => fileRef.current?.click()}><span>📸</span> Camera open karo</button>
            <button className="btn-secondary text-xs" onClick={() => setStep('form')}>Skip photo (urgent ho toh)</button>
          </div>
        )}

        {step === 'form' && (
          <div className="space-y-4">
            {photoPreview && (
              <div className="card">
                <p className="text-xs text-gray-400 mb-2">Photo captured ✓</p>
                <img src={photoPreview} className="w-full rounded-lg" alt="Visit proof" />
              </div>
            )}
            <div className="card space-y-4">
              <p className="section-title">Step 3: Visit details</p>
              <div>
                <label className="label">Outcome</label>
                <select className="input" value={outcome} onChange={e => setOutcome(e.target.value)}>
                  <option>Meeting Done</option>
                  <option>Order Placed</option>
                  <option>Follow-up</option>
                  <option>Sample Given</option>
                  <option>Not Interested</option>
                </select>
              </div>
              <div>
                <label className="label">Items discuss kiye / order</label>
                <input className="input" value={items} onChange={e => setItems(e.target.value)} placeholder="e.g. Oval 500ml, Sipper XL" />
              </div>
              {outcome === 'Order Placed' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Qty (cartons)</label>
                    <input className="input" type="number" value={qty} onChange={e => setQty(e.target.value)} placeholder="10" />
                  </div>
                  <div>
                    <label className="label">Rate per carton (₹)</label>
                    <input className="input" type="number" value={rate} onChange={e => setRate(e.target.value)} placeholder="320" />
                  </div>
                </div>
              )}
              {outcome === 'Follow-up' && (
                <div>
                  <label className="label">Next follow-up date</label>
                  <input className="input" type="date" value={followupDate} onChange={e => setFollowupDate(e.target.value)} />
                </div>
              )}
              <div>
                <label className="label">Remarks</label>
                <textarea className="input" rows={3} value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Kya hua visit mein..." />
              </div>
              <button className="btn-primary" onClick={submitVisit} disabled={saving}>
                {saving ? 'Saving...' : '✓ Visit submit karo'}
              </button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="card text-center py-10 space-y-4">
            <div className="text-5xl">🎉</div>
            <div>
              <p className="font-bold text-lg text-gray-900">Visit log ho gayi!</p>
              <p className="text-gray-500 text-sm mt-1">{party.name} ka record save ho gaya</p>
            </div>
            <button className="btn-primary" onClick={() => router.replace('/field/home')}>Ghar wapas jao</button>
          </div>
        )}
      </div>
    </div>
  )
}
