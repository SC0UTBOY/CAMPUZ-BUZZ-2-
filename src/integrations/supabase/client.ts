import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://seqxzvkodvrqvrvekygy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcXh6dmtvZHZycXZydmVreWd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NjA3MjQsImV4cCI6MjA2NjMzNjcyNH0.p3VxLLuX9JGDaXMluN6Sr3KCRwY8zCUAz5d3QASFEus";

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
