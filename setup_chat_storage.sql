-- Create chat-uploads storage bucket for chat file and image uploads
-- Run this in your Supabase SQL Editor

-- Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-uploads', 'chat-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for chat-uploads bucket
-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload chat files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-uploads');

-- Allow authenticated users to read all chat files
CREATE POLICY "Authenticated users can view chat files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'chat-uploads');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete their own chat files"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'chat-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
