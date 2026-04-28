// @ts-nocheck
'use client'
import { Suspense } from 'react'
import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getCurrentLocation, getDistanceMeters, addWatermarkToPhoto, formatDistance, GPS_VERIFY_RADIUS } from '@/lib/utils'
import { format } from 'date-fns'

function CheckInInner() {
  const router = useRouter()
  const params = useSearchParams()
  const partyId = params.get('party')
  const [party, setParty] = useState(null)
  const [step, setStep] = useState('gps')
  const [gpsLat, setGpsLat] = useState(0)
  const [gpsLng, setGpsLng] = useState(0)
  cons
