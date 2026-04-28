import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function badgeColor(val) {
  const map = {
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
