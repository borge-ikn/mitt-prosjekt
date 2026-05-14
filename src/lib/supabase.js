import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://eeikodpeeybrzgxcsflh.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlaWtvZHBlZXlicnpneGNzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMzY3MjcsImV4cCI6MjA5MzYxMjcyN30.nJFkmdOvpHrq2MGaDIyF0GShPBUOnOB9h-cf9-elsTY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
