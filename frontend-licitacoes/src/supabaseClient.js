import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yqtkwilgezwkoqpytxhy.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxdGt3aWxnZXp3a29xcHl0eGh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNzI2NzcsImV4cCI6MjA3OTc0ODY3N30.q1yERtVTOrPBrd8P1lVip9YVWoTIFwZLd8WCwrYlW7U'

export const supabase = createClient(supabaseUrl, supabaseKey)