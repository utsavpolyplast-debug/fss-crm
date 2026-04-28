export function getDistanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLng/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('GPS not supported')); return }
    navigator.geolocation.getCurrentPosition(
      pos => resolve(pos.coords),
      () => reject(new Error('GPS permission denied — please allow location access')),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  })
}

export async function addWatermarkToPhoto(imageBlob, lat, lng, partyName) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    const url = URL.createObjectURL(imageBlob)
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)
      const stripH = Math.max(60, img.height * 0.08)
      ctx.fillStyle = 'rgba(0,0,0,0.65)'
      ctx.fillRect(0, img.height - stripH, img.width, stripH)
      const fontSize = Math.max(16, img.width * 0.025)
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold ' + fontSize + 'px Arial'
      ctx.textAlign = 'left'
      const now = new Date()
      const dateStr = now.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
      const timeStr = now.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })
      const gpsStr = 'GPS: ' + lat.toFixed(4) + ', ' + lng.toFixed(4)
      const pad = img.width * 0.02
      ctx.fillText('FSS - ' + partyName, pad, img.height - stripH + fontSize + 4)
      ctx.font = (fontSize * 0.8) + 'px Arial'
      ctx.fillText(dateStr + '  ' + timeStr + '  |  ' + gpsStr, pad, img.height - 10)
      URL.revokeObjectURL(url)
      canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.88)
    }
    img.src = url
  })
}

export function formatDistance(meters) {
  if (meters < 1000) return Math.round(meters) + 'm'
  return (meters / 1000).toFixed(1) + 'km'
}

export const GPS_VERIFY_RADIUS = 500

export const DELHI_AREAS = [
  'East Delhi', 'West Delhi', 'North Delhi', 'South Delhi',
  'Central Delhi', 'Noida', 'Gurgaon', 'Faridabad',
  'Ghaziabad', 'Dwarka', 'Rohini', 'Pitampura'
]
