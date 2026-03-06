import { createClient } from '@supabase/supabase-js'

// هذه القيم ستأخذها من إعدادات مشروعك في Supabase (API Settings)
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)
