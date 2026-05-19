import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://lyzzuvmxmjpyepklxiby.supabase.co'  // Cole do Supabase
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx5enp1dm14bWpweWVwa2x4aWJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMDE3MzMsImV4cCI6MjA5NDc3NzczM30.As5c_Y4QR-KqdJfWV0Mh2HkfO55FwAlrBCyhXREBo4E'               // Cole do Supabase

export const supabase = createClient(supabaseUrl, supabaseAnonKey)