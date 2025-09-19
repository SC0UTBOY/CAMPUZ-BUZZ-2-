-- Quick Bucket Creation Fix
-- Copy and paste this into Supabase SQL Editor and run it

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-images',
  'post-images', 
  true,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Verify it was created
SELECT * FROM storage.buckets WHERE id = 'post-images';

-- Success message
SELECT 'Bucket created! Now try uploading your photo again! 📸' as message;
