'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, AreaPlan, Party } from '@/lib/supabase'
import { format, startOfWeek, addDays } from 'date-fns'

export default function FieldSchedule() {
  const router = useRouter()
  const [plans, setPlans] = useState<(AreaPlan & { parties: Party[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState(0)

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekDays = Array.from({ length: 6 }, (_, i) => addDays(weekStart, i))

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { router.replace('/login'); return }

      const weekDates = weekDays.map(d => format(d, 'yyyy-MM-dd'))
      const { data: rawPlans } = await supabase
        .from('area_plans')
        .select('*')
        .eq('user_id', session.user.id)
        .in('plan_date', weekDates)

      const enriched = await Promise.all((rawPlans || []).map(async plan => {
        const { data: pts } = await supabase
          .from('parties').select('*').in('id', plan.party_ids)
          .order('priority', { ascending: true })
        return { ...plan, parties: pts || [] }
      }))
      setPlans(enriched)
      setLoading(false)
    }
    load()
  }, [router])

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const selectedDate = format(weekDays[selectedDay], 'yyyy-MM-dd')
  const selectedPlan = plans.find(p => p.plan_date === selectedDate)

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-400">Loading...</p></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-brand-500 text-white px-4 pt-10 pb-4">
        <button onClick={() => router.back()} className="text-blue-200 text-sm mb-2 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
          </svg> Back
        </button>
        <h1 className="text-lg font-bold">Weekly Schedule</h1>
        <p className="text-blue-200 text-xs">{format(weekStart, 'MMM d')} – {format(addDays(weekStart, 5), 'MMM d, yyyy')}</p>
      </div>

      {/* Day selector */}
      <div className="px-4 py-3 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {weekDays.map((day, i) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const hasPlan = plans.some(p => p.plan_date === dateStr)
            const isToday = dateStr === todayStr
            return (
              <button key={i} onClick={() => setSelectedDay(i)}
                className={`flex flex-col items-center px-3 py-2 rounded-xl transition-all
                  ${selectedDay === i ? 'bg-brand-500 text-white' :
                    isToday ? 'bg-blue-50 border border-brand-500 text-brand-500' : 'bg-white border border-gray-200 text-gray-600'}`}>
                <span className="text-xs">{format(day, 'EEE')}</span>
                <span className="text-sm font-bold">{format(day, 'd')}</span>
                {hasPlan && <div className={`w-1.5 h-1.5 rounded-full mt-1 ${selectedDay === i ? 'bg-blue-200' : 'bg-brand-500'}`}/>}
              </button>
            )
          })}
        </div>
      </div>

      <div className="px-4 pb-8">
        {selectedPlan ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{selectedPlan.area}</p>
                <p className="text-xs text-gray-400">{selectedPlan.parties.length} parties assigned</p>
              </div>
              {selectedDate === todayStr && (
                <button className="bg-brand-500 text-white text-xs px-3 py-1.5 rounded-lg"
                  onClick={() => router.push('/field/home')}>
                  Start today's visits →
                </button>
              )}
            </div>
            {selectedPlan.notes && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-sm text-amber-800">
                📝 {selectedPlan.notes}
              </div>
            )}
            <div className="space-y-2">
              {selectedPlan.parties.map((party, i) => (
                <div key={party.id} className="card flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-xs font-bold text-brand-500">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{party.name}</p>
                    <p className="text-xs text-gray-400">{party.city}</p>
                    {party.products_interested && (
                      <p className="text-xs text-gray-400 truncate">{party.products_interested}</p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 items-end">
                    <span className={`badge text-xs ${party.type === 'Existing Buyer' ? 'bg-green-100 text-green-700' : party.type === 'Ahaar Lead' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                      {party.type === 'Existing Buyer' ? 'Existing' : party.type === 'Ahaar Lead' ? 'Ahaar' : 'New'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="card text-center py-10">
            <p className="text-3xl mb-3">📅</p>
            <p className="text-gray-500 text-sm font-medium">{format(weekDays[selectedDay], 'EEEE, d MMM')}</p>
            <p className="text-gray-400 text-xs mt-1">Koi plan assign nahi hua abhi</p>
          </div>
        )}
      </div>
    </div>
  )
}
