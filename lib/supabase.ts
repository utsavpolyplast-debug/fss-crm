import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type UserRole = 'admin' | 'field'

export interface Party {
  id: string
  name: string
  contact_person: string
  mobile: string
  city: string
  area: string
  address: string
  lat: number | null
  lng: number | null
  type: 'Ahaar Lead' | 'Existing Buyer' | 'New Lead'
  status: 'Active' | 'Follow-up' | 'Cold' | 'Converted'
  products_interested: string
  priority: number
  assigned_to: string | null
  notes: string
  created_at: string
}

export interface Visit {
  id: string
  party_id: string
  user_id: string
  visit_date: string
  checkin_time: string
  gps_lat: number
  gps_lng: number
  gps_verified: boolean
  gps_distance_meters: number
  photo_url: string | null
  outcome: 'Order Placed' | 'Follow-up' | 'Not Interested' | 'Sample Given' | 'Meeting Done'
  items_discussed: string
  remarks: string
  next_followup_date: string | null
  created_at: string
  parties?: Party
  profiles?: { name: string }
}

export interface Order {
  id: string
  party_id: string
  visit_id: string | null
  user_id: string
  order_date: string
  item: string
  qty_cartons: number
  rate_per_carton: number
  total_amount: number
  payment_status: 'Pending' | 'Partial' | 'Received'
  remarks: string
  created_at: string
  parties?: Party
}

export interface AreaPlan {
  id: string
  plan_date: string
  area: string
  user_id: string
  party_ids: string[]
  notes: string
  created_by: string
  created_at: string
  profiles?: { name: string }
}

export interface Profile {
  id: string
  name: string
  role: UserRole
  phone: string
  home_area: string
}
