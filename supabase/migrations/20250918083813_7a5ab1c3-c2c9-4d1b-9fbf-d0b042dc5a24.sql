-- Add missing columns to channels table to match expected interface
ALTER TABLE public.channels 
ADD COLUMN IF NOT EXISTS topic text,
ADD COLUMN IF NOT EXISTS is_private boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS slowmode_seconds integer DEFAULT 0;