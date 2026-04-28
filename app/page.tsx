'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const router = useRouter()
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) { router.replace('/login'); return }
      const { data: profile } = await supabase
        .from('profiles').select('role').eq('id', session.user.id).single()
      if (profile?.role === 'admin') router.replace('/admin/dashboard')
      else router.replace('/field/home')
    })
  }, [router])
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-2xl font-bold text-brand-500 mb-2">FSS CRM</div>
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    </div>
  )
}
