import { Suspense } from 'react'
import CheckInInner from './checkin-inner'

export default function CheckInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Loading...</p>
      </div>
    }>
      <CheckInInner />
    </Suspense>
  )
}
