// @ts-nocheck
'use client'

import { Suspense } from 'react''use client'

import { Suspense } from 'react'
import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getCurrentLocation, getDistanceMeters, addWatermarkToPhoto, formatDistance, GPS_VERIFY_RADIUS } from '@/lib/utils'
import { format } from 'date-fns'

type Step = 'gps' | 'photo' | 'form' | 'done'

function CheckInInner() {
  const router = useRouter()
  const params = useSearchParams()
  const partyId = params.get('party')
  const [party, setParty] = useState<any>(null)
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

  if (!party) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Loading...</p></div>

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
            <div key={s}
