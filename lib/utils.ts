// Calculate distance between two GPS points (Haversine formula)
export function getDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

// Get current GPS coordinates
export function getCurrentLocation(): Promise<GeolocationCoordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('GPS not supported on this device'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve(pos.coords),
      err => reject(new Error('GPS permission denied — please allow location access')),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  })
}

// Add watermark (date, time, GPS) to a photo blob
export async function addWatermarkToPhoto(
  imageBlob: Blob,
  lat: number,
  lng: number,
  partyName: string
): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const img = new Image()
    const url = URL.createObjectURL(imageBlob)

    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      // Watermark background strip
      const stripH = Math.max(60, img.height * 0.08)
      ctx.fillStyle = 'rgba(0,0,0,0.65)'
      ctx.fillRect(0, img.height - stripH, img.width, stripH)

      // Watermark text
      const fontSize = Math.max(16, img.width * 0.025)
      ctx.fillStyle = '#ffffff'
      ctx.font = `bold ${fontSize}px Arial`
      ctx.textAlign = 'left'

      const now = new Date()
      const dateStr = now.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
      const timeStr = now.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })
      const gpsStr = `GPS: ${lat.toFixed(4)}, ${lng.toFixed(4)}`

      const pad = img.width * 0.02
      ctx.fillText(`FSS — ${partyName}`, pad, img.height - stripH + fontSize + 4)
      ctx.font = `${fontSize * 0.8}px Arial`
      ctx.fillText(`${dateStr}  ${timeStr}  |  ${gpsStr}`, pad, img.height - 10)

      URL.revokeObjectURL(url)
      canvas.toBlob(blob => resolve(blob!), 'image/jpeg', 0.88)
    }
    img.src = url
  })
}

// Format distance for display
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`
  return `${(meters / 1000).toFixed(1)}km`
}

// Delhi areas list
export const DELHI_AREAS = [
  'East Delhi', 'West Delhi', 'North Delhi', 'South Delhi',
  'Central Delhi', 'Noida', 'Gurgaon', 'Faridabad',
  'Ghaziabad', 'Dwarka', 'Rohini', 'Pitampura'
]

export const VISIT_OUTCOMES = [
  'Order Placed', 'Follow-up', 'Not Interested', 'Sample Given', 'Meeting Done'
] as const

export const PARTY_TYPES = ['Existing Buyer', 'Ahaar Lead', 'New Lead'] as const
export const PARTY_STATUSES = ['Active', 'Follow-up', 'Cold', 'Converted'] as const
export const PAYMENT_STATUSES = ['Pending', 'Partial', 'Received'] as const

export const GPS_VERIFY_RADIUS = 500 // meters

export function badgeColor(val: string): string {
  const map: Record<string, string> = {
    'Active': 'bg-green-100 text-green-800',
    'Converted': 'bg-blue-100 text-blue-800',
    'Follow-up': 'bg-amber-100 text-amber-800',
    'Cold': 'bg-gray-100 text-gray-600',
    'Order Placed': 'bg-green-100 text-green-800',
    'Not Interested': 'bg-red-100 text-red-700',
    'Sample Given': 'bg-blue-100 text-blue-800',
    'Meeting Done': 'bg-gray-100 text-gray-600',
    'Received': 'bg-green-100 text-green-800',
    'Pending': 'bg-amber-100 text-amber-800',
    'Partial': 'bg-orange-100 text-orange-800',
    'Existing Buyer': 'bg-green-100 text-green-800',
    'Ahaar Lead': 'bg-blue-100 text-blue-800',
    'New Lead': 'bg-amber-100 text-amber-800',
  }
  return map[val] || 'bg-gray-100 text-gray-600'
}
